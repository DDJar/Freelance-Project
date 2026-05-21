import TabPanel, { Item as TabPanelItem } from 'devextreme-react/tab-panel';

import {
  CardTasks,
} from '../..';

export const ContactCards = ({
  isLoading,
  tasks,
  name,
  allUsers,
}) => {
  return (
    <div className='dx-card details-card'>
      <TabPanel
        showNavButtons
        focusStateEnabled={false}
        deferRendering={false}
      >
        <TabPanelItem title='Tasks'>
          <CardTasks
            isLoading={isLoading}
            tasks={tasks}
            allUsers={allUsers} 
          />
        </TabPanelItem>
      </TabPanel>
    </div>
  );
};
