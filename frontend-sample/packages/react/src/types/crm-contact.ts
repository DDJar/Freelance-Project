import { Task } from './task';
import { CONTACT_STATUS_LIST } from '../shared/constants';



export interface Contact {
    id: string;
    username: string;
    firstname: string;
    lastname: string;
    tasks: Task[],
    phoneNumber: string;
    address: string;
    gender: string;
    position: string;
    departmentId: string;
    departmentName?: string; // Tên phòng ban
    email: string;
    role: string;
    status: string;
    country: string;
    city: string;
    hiredDate: Date; 
    birthDate: Date; 
    avatarUrl?: string;
    phone?: string; // Alias for phoneNumber
    image?: string; // Alias for avatarUrl
}
