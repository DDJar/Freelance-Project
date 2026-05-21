import { useEffect, useState, useCallback } from 'react';
import './ProductPanel.scss';
import { productApi } from '../../../api/product';
import { withLoadPanel } from '../../../utils/withLoadPanel';
import { ProductPanelDetails } from './ProductPanelDetails';
import { Product } from '../../../types/product';
const ProductPanelWithLoadPanel = withLoadPanel(ProductPanelDetails);

export const ProductPanel = ({
  id,
  isOpened,
  changePanelOpened,
  changePanelPinned,
  onReloadList
}: {
  id: string | null;
  isOpened: boolean;
  changePanelOpened: (value: boolean) => void;
  changePanelPinned: () => void;
  onReloadList: () => void;
}) => {
  const [data, setData] = useState<Product>();

  const loadData = useCallback(() => {
    if (!id) return;

    productApi
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

  const onDataChanged = useCallback((data: Product | null) => {
    setData(data as any);
  }, []);

useEffect(() => {
  if (id) {
    setData(undefined);
    loadData();
  }
}, [id, loadData]);


  return (
    <ProductPanelWithLoadPanel
      product={data}
      hasData={!!data}
      isOpened={isOpened}
      onDataChanged={onDataChanged}
      changePanelOpened={changePanelOpened}
      changePanelPinned={changePanelPinned}
       onReloadList={onReloadList}
      panelProps={{
        position: { of: '.panel' },
        container: '.panel'
      }}
    />
  );
};
