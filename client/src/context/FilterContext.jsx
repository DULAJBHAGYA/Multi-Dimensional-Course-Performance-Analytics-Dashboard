import React, { createContext, useContext, useState } from 'react';

const FilterContext = createContext();

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};

export const FilterProvider = ({ children }) => {
  const [filters, setFilters] = useState({
    // Date range filters
    dateRange: {
      startDate: null,
      endDate: null
    },
    // Course filters
    courses: [],
    selectedCourses: [],
    // Student filters
    students: [],
    selectedStudents: [],
    // Performance filters
    performanceRange: {
      min: 0,
      max: 100
    },
    // Grade level filters
    gradeLevels: [],
    selectedGradeLevels: [],
    // Department filters
    departments: [],
    selectedDepartments: [],
    // Time period filters
    timePeriod: 'all', // 'all', 'week', 'month', 'quarter', 'year'
    // Search filters
    searchQuery: '',
    // Sort options
    sortBy: 'date', // 'date', 'performance', 'name', 'course'
    sortOrder: 'desc' // 'asc', 'desc'
  });

  const updateFilter = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const updateMultipleFilters = (updates) => {
    setFilters(prev => ({
      ...prev,
      ...updates
    }));
  };

  const resetFilters = () => {
    setFilters({
      dateRange: {
        startDate: null,
        endDate: null
      },
      courses: [],
      selectedCourses: [],
      students: [],
      selectedStudents: [],
      performanceRange: {
        min: 0,
        max: 100
      },
      gradeLevels: [],
      selectedGradeLevels: [],
      departments: [],
      selectedDepartments: [],
      timePeriod: 'all',
      searchQuery: '',
      sortBy: 'date',
      sortOrder: 'desc'
    });
  };

  const clearFilter = (filterName) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: Array.isArray(prev[filterName]) ? [] : 
                   typeof prev[filterName] === 'object' && prev[filterName] !== null ? 
                   Object.keys(prev[filterName]).reduce((acc, key) => ({ ...acc, [key]: null }), {}) :
                   ''
    }));
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    
    // Check date range
    if (filters.dateRange.startDate || filters.dateRange.endDate) count++;
    
    // Check selected items
    if (filters.selectedCourses.length > 0) count++;
    if (filters.selectedStudents.length > 0) count++;
    if (filters.selectedGradeLevels.length > 0) count++;
    if (filters.selectedDepartments.length > 0) count++;
    
    // Check performance range
    if (filters.performanceRange.min > 0 || filters.performanceRange.max < 100) count++;
    
    // Check other filters
    if (filters.timePeriod !== 'all') count++;
    if (filters.searchQuery) count++;
    
    return count;
  };

  const value = {
    filters,
    updateFilter,
    updateMultipleFilters,
    resetFilters,
    clearFilter,
    getActiveFiltersCount
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};
