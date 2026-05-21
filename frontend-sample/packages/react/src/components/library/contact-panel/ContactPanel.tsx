import { useEffect, useState, useCallback } from 'react';
import './ContactPanel.scss';
import { userApi } from '../../../api/user';
import { withLoadPanel } from '../../../utils/withLoadPanel';
import { ContactPanelDetails } from './ContactPanelDetails';
import { User } from '../../../types/auth';
const UserPanelWithLoadPanel = withLoadPanel(ContactPanelDetails);

export const ContactPanel = ({
  userId,
  isOpened,
  changePanelOpened,
  changePanelPinned
}: {
  userId: string | null;
  isOpened: boolean;
  changePanelOpened: (value: boolean) => void;
  changePanelPinned: () => void;
}) => {
  const [data, setData] = useState<User>();

  const loadData = useCallback(() => {
    if (!userId) return;

    userApi
      .getById(userId.toString()) 
      .then((result) => {
        if (result.isOk && result.data) {
          setData(result.data);
        } else {
          console.error(result.message);
        }
      })
      .catch((error) => console.log(error));
  }, [userId]);

  const onDataChanged = useCallback((data: User | null) => {
    setData(data as any);
  }, []);

useEffect(() => {
  if (userId) {
    setData(undefined);
    loadData();
  }
}, [userId, loadData]);


  return (
    <UserPanelWithLoadPanel
      user={data}
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
