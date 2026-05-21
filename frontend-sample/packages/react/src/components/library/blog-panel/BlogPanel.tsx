import { useEffect, useState, useCallback } from 'react';
import './BlogPanel.scss';
import { blogApi } from '../../../api/blog';
import { withLoadPanel } from '../../../utils/withLoadPanel';
import { BlogPanelDetails } from './BlogPanelDetails';
import { Blog } from '../../../types/blog';

const BlogPanelWithLoadPanel = withLoadPanel(BlogPanelDetails);

export const BlogPanel = ({
  blogId,
  isOpened,
  changePanelOpened,
  changePanelPinned,
  isPinned,
  onBlogDataChanged
}: {
  blogId: string | null;
  isOpened: boolean;
  changePanelOpened: (value: boolean) => void;
  changePanelPinned: () => void;
  isPinned?: boolean;
  onBlogDataChanged?: (data: Blog | null) => void;
}) => {
  const [data, setData] = useState<Blog>();

  const loadData = useCallback(() => {
    if (!blogId) return;

    blogApi
      .getById(blogId.toString())
      .then((result) => {
        if (result.isOk && result.data) {
          setData(result.data);
        } else {
          console.error(result.message);
          // FIX: Nếu không load được data, đóng panel
          changePanelOpened(false);
        }
      })
      .catch((error) => {
        console.error(error);
        changePanelOpened(false);
      });
  }, [blogId, changePanelOpened]);

  // FIX: Cải thiện data change handler
  const onDataChanged = useCallback((updatedData: Blog | null) => {
    if (updatedData) {
      setData(updatedData);
    } else {
      setData(undefined);
    }
    // Notify parent component
    if (onBlogDataChanged) {
      onBlogDataChanged(updatedData);
    }
  }, [onBlogDataChanged]);

  useEffect(() => {
    if (blogId && isOpened) {
      setData(undefined); // Reset data trước khi load
      loadData();
    } else if (!isOpened) {
      // Reset data khi panel đóng
      setData(undefined);
    }
  }, [blogId, isOpened, loadData]);

  // Không render nếu panel không mở hoặc không có blogId
  if (!isOpened || !blogId) {
    return null;
  }

  return (
    <BlogPanelWithLoadPanel
      blog={data}
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