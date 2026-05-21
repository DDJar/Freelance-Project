import React, { useState, useRef, useCallback, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button, { ButtonTypes } from 'devextreme-react/button';
import Form, { Item, Label, ButtonItem, ButtonOptions, RequiredRule, EmailRule } from 'devextreme-react/form';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import { useAuth } from '../../../contexts/auth';
import { ThemeContext } from '../../../theme/theme';
import './LoginForm.scss';

function getButtonStylingMode(theme: string | undefined): ButtonTypes.ButtonStyle {
  return theme === 'dark' ? 'outlined' : 'contained';
}

export const LoginForm = ({ resetLink }) => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const formData = useRef({ email: '', password: '' });
  const themeContext = useContext(ThemeContext);

  const onSubmit = useCallback(
    async(e) => {
      e.preventDefault();
      const { email, password } = formData.current;
      setLoading(true);

      const result = await signIn(email, password);
      setLoading(false);
      if (result.isOk) {
        notify('Login successful!', 'success', 2000);
        navigate('/');
      } else {
        notify(result.message, 'error', 3000);
      }
    },
    [signIn, navigate]
  );
  return (
    <form className='login-form' onSubmit={onSubmit}>
      <Form
        labelLocation='top'
        formData={formData.current}
        disabled={loading}
        showColonAfterLabel
      >
        <Item dataField='email' editorType='dxTextBox' editorOptions={emailEditorOptions}>
          <RequiredRule message='Email is required' />
          <EmailRule message='Email is invalid' />
          <Label text='Email' />
        </Item>
        <Item dataField='password' editorType='dxTextBox' editorOptions={passwordEditorOptions}>
          <RequiredRule message='Password is required' />
          <Label text='Password' />
        </Item>
        <Item dataField='rememberMe' editorType='dxCheckBox' editorOptions={rememberMeEditorOptions}>
          <Label visible={false} />
        </Item>
        <ButtonItem>
          <ButtonOptions width='100%' type='default' useSubmitBehavior>
            <span className='dx-button-text'>
              {loading ? <LoadIndicator width='24px' height='24px' visible /> : 'Sign In'}
            </span>
          </ButtonOptions>
        </ButtonItem>
      </Form>
    </form>
  );
};

const emailEditorOptions = {
  stylingMode: 'filled',
  mode: 'email',
  placeholder: 'Enter your email'
};

const passwordEditorOptions = {
  stylingMode: 'filled',
  mode: 'password',
  placeholder: 'Enter your password'
};

const rememberMeEditorOptions = {
  text: 'Remember me',
  elementAttr: { class: 'form-text' }
}
