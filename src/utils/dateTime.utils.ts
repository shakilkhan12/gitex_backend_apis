
export const formatDate = (date: Date | string | null): string | null => {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  } catch (error) {
    return null;
  }
};

export const formatTime = (time: Date | string | null): string | null => {
  if (!time) return null;
  
  try {
    const timeObj = typeof time === 'string' ? new Date(time) : time;
    
    if (timeObj.getFullYear() === 1970) {
      return timeObj.toTimeString().split(' ')[0]; // Returns HH:MM:SS format
    }
    
    return timeObj.toTimeString().split(' ')[0];
  } catch (error) {
    return null;
  }
};

export const formatDateTime = (dateTime: Date | string | null): string | null => {
  if (!dateTime) return null;
  
  try {
    const dateTimeObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    return dateTimeObj.toISOString();
  } catch (error) {
    return null;
  }
};

export const mapPersonIdToEmpId = (personId: string): string => {
  const mapping: { [key: string]: string } = {
    'P001': 'EMP001',
    'P002': 'EMP002', 
    'P003': 'EMP003',
    'P004': 'EMP004',
    'P005': 'EMP005',
  };
  
  return mapping[personId] || personId;
};

export const mapEmpIdToPersonId = (empId: string): string => {
  const mapping: { [key: string]: string } = {
    'EMP001': 'P001',
    'EMP002': 'P002',
    'EMP003': 'P003', 
    'EMP004': 'P004',
    'EMP005': 'P005',
  };
  
  return mapping[empId] || empId;
};





