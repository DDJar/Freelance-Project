import React from 'react';


export interface BlogProp {
    text: string;
    showText?: boolean;
}

export interface BlogFormEdit {
    label: string;
    value: string;
    setValue: (obj: { status?: BlogStatus, published?: boolean }) => void
}

export interface BlogFormEditComponent extends BlogFormEdit {
    items: string[];
    editComponent: React.ComponentType<BlogProp>;
}

export interface BlogListProps {
    dataSource: Blog[];
    changePopupVisibility?: () => void;
}

import { Blog, BlogStatus } from './blog';
