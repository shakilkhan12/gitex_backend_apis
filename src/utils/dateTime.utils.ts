/**
 * Utility functions for date and time formatting
 */

export const formatDate = (date: Date | string | null): string | null => {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  } catch (error) {
    console.error('Error formatting date:', error);
    return null;
  }
};

export const formatTime = (time: Date | string | null): string | null => {
  if (!time) return null;
  
  try {
    const timeObj = typeof time === 'string' ? new Date(time) : time;
    
    // Check if it's a Unix epoch date (1970-01-01) which indicates time-only data
    if (timeObj.getFullYear() === 1970) {
      return timeObj.toTimeString().split(' ')[0]; // Returns HH:MM:SS format
    }
    
    // If it's a regular date, extract just the time part
    return timeObj.toTimeString().split(' ')[0];
  } catch (error) {
    console.error('Error formatting time:', error);
    return null;
  }
};

export const formatDateTime = (dateTime: Date | string | null): string | null => {
  if (!dateTime) return null;
  
  try {
    const dateTimeObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    return dateTimeObj.toISOString();
  } catch (error) {
    console.error('Error formatting dateTime:', error);
    return null;
  }
};

/**
 * Maps person_Id from attendance records to emp_Id in users table
 */
export const mapPersonIdToEmpId = (personId: string): string => {
  // Handle the mismatch between person_Id and emp_Id
  const mapping: { [key: string]: string } = {
    'P001': 'EMP001',
    'P002': 'EMP002', 
    'P003': 'EMP003',
    'P004': 'EMP004',
    'P005': 'EMP005',
    // Add more mappings as needed
  };
  
  return mapping[personId] || personId;
};

/**
 * Maps emp_Id from users table to person_Id for attendance records
 */
export const mapEmpIdToPersonId = (empId: string): string => {
  // Reverse mapping
  const mapping: { [key: string]: string } = {
    'EMP001': 'P001',
    'EMP002': 'P002',
    'EMP003': 'P003', 
    'EMP004': 'P004',
    'EMP005': 'P005',
    // Add more mappings as needed
  };
  
  return mapping[empId] || empId;
};





