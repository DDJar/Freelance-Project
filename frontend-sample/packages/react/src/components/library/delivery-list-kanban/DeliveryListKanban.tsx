import React, { useState, useEffect, useCallback } from 'react';
import ScrollView from 'devextreme-react/scroll-view';
import { Sortable, SortableRef, SortableTypes } from 'devextreme-react/sortable';
import Button from 'devextreme-react/button';
import notify from "devextreme/ui/notify";

import { CardMenu } from '../card-menu/CardMenu';
import { DeliveryKanbanCard } from '../delivery-kanban-card/DeliveryKanbanCard'; 

import { Delivery } from '../../../types/delivery';
import { deliveryApi } from '../../../api/delivery';

import './DeliveryListKanban.scss';

const DELIVERY_STATUSES = ["Đang chờ" , "Đã giao" , "Đã hủy"];

const boardMenuItems = [
  { text: 'Add Delivery' },
  { text: 'Copy list' },
  { text: 'Move list' },
];

const reorder = <T, >(items: T[], item: T, fromIndex: number, toIndex: number) => {
  let result = items;
  if (fromIndex >= 0) {
    result = [...result.slice(0, fromIndex), ...result.slice(fromIndex + 1)];
  }
  if (toIndex >= 0) {
    result = [...result.slice(0, toIndex), item, ...result.slice(toIndex)];
  }
  return result;
};

const DeliveryList = ({
  title,
  index,
  deliveries,
  onDeliveryDragStart,
  onDeliveryDrop,
  changePopupVisibility,
}: {
  title: string,
  index: number,
  deliveries: Delivery[],
  onDeliveryDragStart: (e: SortableTypes.DragStartEvent) => void,
  onDeliveryDrop: (e: SortableTypes.ReorderEvent) => void,
  changePopupVisibility?: () => void,
}) => {
  return (
    <div className='list'>
      <div className='list-title theme-text-color'>
        <span>{title}</span>
        <span>{deliveries.length}</span>
        <CardMenu items={boardMenuItems} />
      </div>
      <ScrollView className='scrollable-list' direction='vertical' showScrollbar='always'>
        <Sortable
          className='sortable-cards'
          group='cardsGroup'
          data={index}
          onDragStart={onDeliveryDragStart}
          onReorder={onDeliveryDrop}
          onAdd={onDeliveryDrop}
        >
          {deliveries.map((delivery) => (
            <DeliveryKanbanCard key={delivery.id} delivery={delivery} />
          ))}
        </Sortable>
        <div className='add-task'>
          
        </div>
      </ScrollView>
    </div>
  );
};

interface DeliveryListKanbanProps {
  dataSource: Delivery[];
  changePopupVisibility?: () => void;
  onDeliveryUpdated?: () => void;
}

export const DeliveryListKanban = React.forwardRef<SortableRef, DeliveryListKanbanProps>(
  ({ dataSource, changePopupVisibility, onDeliveryUpdated }, ref) => {
    const [lists, setLists] = useState<Delivery[][]>([]);
    const [statuses, setStatuses] = useState(DELIVERY_STATUSES);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
      const groupedLists: Delivery[][] = DELIVERY_STATUSES.map((status) =>
        dataSource.filter((d) => d.status === status)
      );
      setLists(groupedLists);
    }, [dataSource]);

    const onListReorder = useCallback(
      ({ fromIndex, toIndex }: SortableTypes.ReorderEvent) => {
        setLists(reorder(lists, lists[fromIndex], fromIndex, toIndex));
        setStatuses(reorder(statuses, statuses[fromIndex], fromIndex, toIndex));
      },
      [lists, statuses]
    );

    const onDeliveryDragStart = useCallback(
      (e: SortableTypes.DragStartEvent) => {
        e.itemData = lists[e.fromData][e.fromIndex];
      },
      [lists]
    );

    const onDeliveryDrop = useCallback(
      async (e: SortableTypes.ReorderEvent) => {
        const updatedLists = [...lists];
        const newStatus = statuses[e.toData];
        const oldStatus = e.itemData.status;

        e.itemData.status = newStatus;

        updatedLists[e.fromData] = reorder(updatedLists[e.fromData], e.itemData, e.fromIndex, -1);
        updatedLists[e.toData] = reorder(updatedLists[e.toData], e.itemData, -1, e.toIndex);
        setLists(updatedLists);

        if (oldStatus !== newStatus) {
          setUpdating(true);
          try {
            const res = await deliveryApi.update(e.itemData.id, {
              ...e.itemData,
              status: newStatus,
            });

            if (res.isOk) {
              notify(`Delivery ${e.itemData.billId} moved to ${newStatus}`, "success", 2000);
              onDeliveryUpdated?.();
            } else {
              throw new Error(res.message || "Failed to update");
            }
          } catch (error) {
            e.itemData.status = oldStatus;
            const reverted = [...lists];
            reverted[e.toData] = reorder(reverted[e.toData], e.itemData, e.toIndex, -1);
            reverted[e.fromData] = reorder(reverted[e.fromData], e.itemData, -1, e.fromIndex);
            setLists(reverted);

            notify(`Error: ${error}`, "error", 3000);
          } finally {
            setUpdating(false);
          }
        }
      },
      [lists, statuses, onDeliveryUpdated]
    );

    return (
      <div id='kanban' className='kanban'>
        <ScrollView direction='both' showScrollbar='always'>
          <Sortable
            ref={ref}
            itemOrientation='horizontal'
            handle='.list-title'
            onReorder={onListReorder}
          >
            {lists.map((deliveries, listIndex) => {
              const status = statuses[listIndex];
              return (
                <DeliveryList
                  key={status}
                  title={status}
                  index={listIndex}
                  deliveries={deliveries}
                  onDeliveryDragStart={onDeliveryDragStart}
                  onDeliveryDrop={onDeliveryDrop}
                  changePopupVisibility={changePopupVisibility}
                />
              );
            })}
          </Sortable>
        </ScrollView>
        {updating && (
          <div className="updating-overlay">
            <span>Updating delivery...</span>
          </div>
        )}
      </div>
    );
  }
);
