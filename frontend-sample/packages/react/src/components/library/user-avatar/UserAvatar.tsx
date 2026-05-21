import './UserAvatar.scss';
export const UserAvatar = ({ assignedTo }: { assignedTo: string[] }) => {
  return (
    <div className='avatar-group'>
      {assignedTo.map((user, index) => (
        <div key={index} className='avatar'>{user}</div>
      ))}
    </div>
  );
};

