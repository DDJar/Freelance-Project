export type BlogStatus = 'Draft' | 'Published' | 'Archived';

export interface Blog {
  id: string;
  title: string;
  content: string;
  author: string;
  status: BlogStatus;
  imageId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogFormData extends Partial<Blog> {
  image?: File;
}


export interface BlogProp {
  text: string;
  showText?: boolean;
}

export interface BlogListProps {
  dataSource: Blog[];
  changePopupVisibility?: () => void;
}
