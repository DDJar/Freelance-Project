import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from 'devextreme/localization';
import './TaskKanbanCard.scss';
import { Task } from '../../../types/task';

export const TaskKanbanCard = ({ task }: { task: Task }) => {
  const navigate = useNavigate();

  const navigateToDetails = () => {
    navigate(`/planning-task-details/${task.id}`);
  };

  const now = new Date();

  const statusInfo = useMemo(() => {
    if (task.status === 'In Progress' && task.dueDate) {
      const due = new Date(task.dueDate);
      const diffMs = due.getTime() - now.getTime();

      if (diffMs > 0) {
        const minutes = Math.floor(diffMs / 60000);
        return { text: `Time left: ${minutes} min`, className: 'on-time' };
      } else {
        const minutes = Math.ceil(Math.abs(diffMs) / 60000);
        return { text: `Late by ${minutes} min`, className: 'late' };
      }
    }

    if (task.status === 'Deferred') {
      return { text: 'Task is deferred', className: 'deferred' };
    }

    if (task.status === 'Completed') {
      if (task.result === 'On time') {
        return { text: 'On time ✅', className: 'on-time' };
      }
      return { text: task.result, className: 'late' };
    }

    return null;
  }, [task, now]);

  return (
    <div className='kanban-card dx-card theme-text-color theme-bg-color' onClick={navigateToDetails}>
      <div className={`card-wrapper priority-${task.priority.toLowerCase()}`}>
        <div className='card-priority' />
        <div className='card-content'>
          <div className='card-header'>
            <div className='card-subject theme-text-color'>{task.title}</div>
            <div className='estimated-hour theme-text-color'>{task.estimatedHour}h</div>
          </div>

          <div className='card-data'>
            <span className='priority'>{task.priority}</span>
            <span className='date theme-text-color'>{task.dueDate && formatDate(new Date(task.dueDate), 'MM/dd/yyyy')}</span>
          </div>
          <div className='card-assignee'>
            <span className='company theme-text-color'>{task.company}</span>
          </div>

          {statusInfo && (
            <div className={`card-status ${statusInfo.className}`}>{statusInfo.text}</div>
          )}
        </div>
      </div>
    </div>
  );
};
