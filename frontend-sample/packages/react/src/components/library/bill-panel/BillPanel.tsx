import { useEffect, useState, useCallback } from 'react';
import './BillPanel.scss';
import { billApi } from '../../../api/bill';
import { withLoadPanel } from '../../../utils/withLoadPanel';
import { BillPanelDetails } from './BillPanelDetails';
import { Bill } from '../../../types/bill';
const BillPanelWithLoadPanel = withLoadPanel(BillPanelDetails);

export const BillPanel = ({
  id,
  isOpened,
  isPinned,
  changePanelOpened,
  changePanelPinned
}: {
  id: string | null;
  isOpened: boolean;
  isPinned?: boolean;
  changePanelOpened: (value: boolean) => void;
  changePanelPinned: () => void;
}) => {
  const [data, setData] = useState<Bill>();

  const loadData = useCallback(() => {
    if (!id) return;

    billApi
      .getById(id.toString()) 
      .then((result) => {
        if (result.isOk && result.data) {
          setData(result.data);
        } else {
          console.error(result.message);
        }
      })
      .catch((error) => console.log(error));
  }, [id]);

  const onDataChanged = useCallback((data: Bill | null) => {
    setData(data as any);
  }, []);

useEffect(() => {
  if (id) {
    setData(undefined);
    loadData();
  }
}, [id, loadData]);


  return (
    <BillPanelWithLoadPanel
      bill={data}
      hasData={!!data}
      isOpened={isOpened}
      onDataChanged={onDataChanged}
      changePanelOpened={changePanelOpened}
      changePanelPinned={changePanelPinned}
      panelProps={{
        position: { of: '.panel' },
        container: '.panel'
      }}
    />
  );
};
