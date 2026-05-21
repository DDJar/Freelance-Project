import { CardAuth, LoginForm } from '../../components';

export const SignInPage = () => {
  return (
    <CardAuth title='Sign In'>
      <LoginForm
        resetLink='/reset-password-form'
      />
    </CardAuth>
  );
};
