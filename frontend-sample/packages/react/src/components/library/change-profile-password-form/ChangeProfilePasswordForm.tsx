import './ChangeProfilePasswordForm.scss';
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import notify from 'devextreme/ui/notify';
import { ValidationRule } from 'devextreme-react/common';
import Form, { Item, Label } from 'devextreme-react/form';
import { ValidatorRef, ValidatorTypes } from 'devextreme-react/validator';
import { FormPopup } from '../../utils/form-popup/FormPopup';
import { PasswordTextBox } from '../password-text-box/PasswordTextBox';
import { userApi } from '../../../api/user'; // Import userApi

type ChangeProfilePasswordFormProps = {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  onSave: () => void;
  userId: string; // Thêm userId prop
};

export const ChangeProfilePasswordForm = ({
  visible,
  setVisible,
  onSave,
  userId,
}: ChangeProfilePasswordFormProps) => {
  const confirmField = useRef<ValidatorRef>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmedPassword, setConfirmedPassword] = useState('');
  const [currentPasswordValid, setCurrentPasswordValid] = useState(false);
  const [newPasswordValid, setNewPasswordValid] = useState(false);
  const [confirmedPasswordValid, setConfirmedPasswordValid] = useState(false);
  const [isSaveDisabled, setIsSaveDisabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Password validation rules
  const currentPasswordValidators = useMemo((): ValidationRule[] => {
    return [
      {
        type: 'required',
        message: 'Current password is required',
      },
    ];
  }, []);

  const newPasswordValidators = useMemo((): ValidationRule[] => {
    return [
      {
        type: 'required',
        message: 'New password is required',
      },
      {
        type: 'stringLength',
        min: 6,
        message: 'Password must be at least 6 characters long',
      },
      {
        type: 'custom',
        message: 'New password must be different from current password',
        validationCallback: (options) => {
          return options.value !== currentPassword;
        },
      },
    ];
  }, [currentPassword]);

  const confirmPasswordValidators = useMemo((): ValidationRule[] => {
    return [
      {
        type: 'required',
        message: 'Please confirm your new password',
      },
      {
        type: 'compare',
        message: 'Passwords do not match',
        comparisonTarget: () => newPassword,
      },
    ];
  }, [newPassword]);

  // Check if form is valid
  useEffect(() => {
    const formValues = [currentPassword, newPassword, confirmedPassword];
    const validity = [currentPasswordValid, newPasswordValid, confirmedPasswordValid];

    setIsSaveDisabled(
      isLoading ||
      formValues.some((value) => !value) ||
      validity.some((value) => !value)
    );
  }, [
    currentPassword,
    newPassword,
    confirmedPassword,
    currentPasswordValid,
    newPasswordValid,
    confirmedPasswordValid,
    isLoading
  ]);

  const checkConfirm = useCallback(() => {
    if (confirmField.current) {
      confirmField.current.instance().validate();
    }
  }, []);

  const onCurrentPasswordValidated = useCallback((e: ValidatorTypes.ValidatedEvent) => {
    setCurrentPasswordValid(!!e.isValid);
  }, []);

  const onConfirmedPasswordValidated = useCallback((e: ValidatorTypes.ValidatedEvent) => {
    setConfirmedPasswordValid(!!e.isValid);
  }, []);

  const onNewPasswordValidated = useCallback((e: ValidatorTypes.ValidatedEvent) => {
    setNewPasswordValid(!!e.isValid);
  }, []);

  const onNewPasswordChange = useCallback((value: string) => {
    setNewPassword(value);
    checkConfirm();
  }, [checkConfirm]);

  // Reset form when closing popup
  const resetForm = useCallback(() => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmedPassword('');
    setCurrentPasswordValid(false);
    setNewPasswordValid(false);
    setConfirmedPasswordValid(false);
    setIsLoading(false);
  }, []);

  // Handle popup close
  const handleClose = useCallback(() => {
    if (!isLoading) {
      resetForm();
      setVisible(false);
    }
  }, [resetForm, setVisible, isLoading]);

  // Handle save new password
  const saveNewPassword = useCallback(async (): Promise<void> => {
    if (!userId || isSaveDisabled) return;
    setIsLoading(true);
    
    try {
      const result = await userApi.changePassword(userId, currentPassword, newPassword);
      
      if (result.isOk) {
        notify(
          { 
            message: result.message || 'Password changed successfully', 
            position: { at: 'bottom center', my: 'bottom center' } 
          }, 
          'success'
        );
        
        // Reset form and close popup
        resetForm();
        setVisible(false);
        
        // Call parent callback
        onSave();
      } else {
        notify(
          { 
            message: result.message || 'Failed to change password', 
            position: { at: 'bottom center', my: 'bottom center' } 
          }, 
          'error'
        );
      }
    } catch (error) {
      console.error('Change password error:', error);
      notify(
        { 
          message: 'An unexpected error occurred while changing password', 
          position: { at: 'bottom center', my: 'bottom center' } 
        }, 
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentPassword, newPassword, isSaveDisabled, resetForm, setVisible, onSave]);

  return (
    <FormPopup
      title='Đổi mật khẩu'
      visible={visible}
      width={360}
      height={450}
      wrapperAttr={{ class: 'change-profile-password-popup' }}
      isSaveDisabled={isSaveDisabled}
      onSave={saveNewPassword}
      setVisible={handleClose}
    >
      <Form 
        id='change-password-form'
        labelMode='outside'
        showColonAfterLabel
        labelLocation='top'
      >
        <Item>
          <Label text='Mật khẩu hiện tại' />
          <PasswordTextBox
            value={currentPassword}
            validators={currentPasswordValidators}
            onValueChange={setCurrentPassword}
            onValueValidated={onCurrentPasswordValidated}
            placeholder="Nhập mật khẩu hiện tại"
          />
        </Item>

        <Item>
          <div className='h-separator' />
        </Item>

        <Item>
          <Label text='Mật khẩu mới' />
          <PasswordTextBox
            value={newPassword}
            validators={newPasswordValidators}
            onValueChange={onNewPasswordChange}
            onValueValidated={onNewPasswordValidated}
            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự"
          />
        </Item>

        <Item>
          <Label text='Xác nhận mật khẩu mới' />
          <PasswordTextBox
            ref={confirmField}
            value={confirmedPassword}
            validators={confirmPasswordValidators}
            onValueChange={setConfirmedPassword}
            onValueValidated={onConfirmedPasswordValidated}
            placeholder="Xác nhận mật khẩu mới"
          />
        </Item>
      </Form>
    </FormPopup>
  );
};