import classNames from 'classnames';
import From, { Item as ItemForm, GroupItem, ColCountByScreen } from 'devextreme-react/form';
import SelectBox from 'devextreme-react/select-box';
import Button from 'devextreme-react/button';
import TextBox from 'devextreme-react/text-box';
import { EmailRule } from 'devextreme-react/validator';

import { FormPhoto } from '../../utils/form-photo/FormPhoto';
import { ContactStatus } from '../../utils/contact-status/ContactStatus';
import { FormTextbox } from '../../utils/form-textbox/FormTextbox';

import { Contact } from '../../../types/crm-contact';
import { CONTACT_STATUS_LIST } from '../../../shared/constants';

const PHOTO_SIZE = 184;

const statusRender = (text?: string | null) => {
  const safeText = text || "unknown";

  return (
    <div className='status-editor-field'>
      <ContactStatus text={safeText} showText={false} />
      <TextBox
        className={`status-contact status-${safeText.toLowerCase()}`}
        inputAttr={{ statusEditorInput: '' }}
        readOnly
        text={safeText}
        hoverStateEnabled={false}
      />
    </div>
  );
};


const statusItemRender = (text: string) => <ContactStatus text={text} />;

export const ContactFromDetails = ({ data, editing, updateField }: {
  data: Contact, editing: boolean, updateField: (field: string | number) => (value: string | number) => void
}) => {
  const stylingMode = 'filled';
  return (
    <From
      className={classNames({ 'plain-styled-form': true, 'view-mode': !editing })}
      labelMode='floating'
    >
      <GroupItem colCount={2}>
        <ColCountByScreen xs={2} />
        <ItemForm>
          <FormPhoto link={data.image ?? ''} size={PHOTO_SIZE} />
        </ItemForm>

        <GroupItem>
          <ItemForm>
            <SelectBox
              label='Status'
              width='100%'
              value={data.status}
              readOnly={!editing}
              items={CONTACT_STATUS_LIST}
              stylingMode={stylingMode}
              fieldRender={statusRender}
              itemRender={statusItemRender}
              onValueChange={updateField('status')}
            />
          </ItemForm>

          <ItemForm>
            <FormTextbox
              label='Họ'
              value={data.firstname}
              isEditing={!editing}
              onValueChange={updateField('firstName')}
            />
          </ItemForm>

          <ItemForm>
            <FormTextbox
              label='Tên'
              value={data.lastname}
              isEditing={!editing}
              onValueChange={updateField('lastName')}
            />
          </ItemForm>
        </GroupItem>

        <ItemForm>
          <FormTextbox
            label='Vị trí trong công ty'
            value={data.position}
            isEditing={!editing}
            onValueChange={updateField('position')}
          />
        </ItemForm>

        <ItemForm cssClass='accent' colSpan={2}>
          <FormTextbox
            label='Công ty'
            value={data.departmentName || data.departmentId}
            isEditing={!editing}
            onValueChange={updateField('departmentName')}
          />
        </ItemForm>
      </GroupItem>

      <GroupItem colCount={4} caption='Phương thức liên lạc'>
        <ColCountByScreen xs={2} />
        <ItemForm colSpan={4}>
          <FormTextbox
            label='Địa chỉ'
            value={data.address}
            isEditing={!editing}
            onValueChange={updateField('address')}
          />
        </ItemForm>

        <ItemForm colSpan={2}>
          <FormTextbox
            label='Thành phố'
            value={data.city}
            isEditing={!editing}
            onValueChange={updateField('city')}
          />
        </ItemForm>
      </GroupItem>

      <GroupItem colCount={2} cssClass='contact-fields-group'>
        <ColCountByScreen xs={2} />
        <ItemForm>
          <FormTextbox
            label='Số điện thoại'
            value={data.phone ?? ''}
            mask='+84 000 000 000'
            isEditing={!editing}
            onValueChange={updateField('phone')}
          />
          <Button
            className='form-item-button'
            visible={!editing}
            text='Call'
            icon='tel'
            type='default'
            stylingMode='outlined'
          />
        </ItemForm>

        <ItemForm>
          <FormTextbox
            label='Email'
            value={data.email}
            isEditing={!editing}
            onValueChange={updateField('email')}
          >
            <EmailRule />
          </FormTextbox>
          <Button
            className='form-item-button'
            visible={!editing}
            text='Send Email'
            icon='email'
            type='default'
            stylingMode='outlined'
          />
        </ItemForm>
      </GroupItem>
    </From>
  );
};
