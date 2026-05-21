import { DropDownButton } from 'devextreme-react/drop-down-button';
import './CardMenu.scss';

type CardMenuProps = {
  items?: any[];
  visible?: boolean;
};

export const CardMenu = ({ items = [], visible = true }: CardMenuProps) => {
  return (
    <DropDownButton
      className='overflow-menu'
      items={items}
      visible={visible}
      icon='overflow'
      stylingMode='text'
      showArrowIcon={false}
      dropDownOptions={{ width: 'auto' }}
    />
  );
};
