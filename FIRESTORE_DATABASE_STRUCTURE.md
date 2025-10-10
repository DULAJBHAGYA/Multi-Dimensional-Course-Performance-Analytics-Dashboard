# Firestore Database Structure

This document provides a comprehensive overview of all collections and their respective fields in the Firestore database.

## Collections Overview

Total collections: 9

1. [admins](#admins)
2. [campuses](#campuses)
3. [courses](#courses)
4. [departmentHeads](#departmentheads)
5. [departments](#departments)
6. [instructors](#instructors)
7. [sections](#sections)
8. [semesters](#semesters)
9. [students](#students)

---

## admins

**Description**: Administrator users with access to the system

**Fields**:
- `adminId` (string): Unique identifier for the admin
- `campus` (string): Campus the admin is associated with
- `department` (string): Department the admin is associated with
- `email` (string): Admin's email address
- `password` (string): Admin's password
- `username` (string): Admin's username

---

## campuses

**Description**: Campus locations where courses are offered

**Fields**:
- `campusId` (string): Unique identifier for the campus
- `campus` (string): Name of the campus

---

## courses

**Description**: Academic courses offered by the institution

**Fields**:
- `courseCode` (string): Unique course code (e.g., "CIS001")
- `courseName` (string): Full name of the course (e.g., "Database Systems")
- `department` (string): Department offering the course

---

## departmentHeads

**Description**: Department head users with oversight responsibilities

**Fields**:
- `campus` (string): Campus the department head is associated with
- `campusId` (string): Campus ID the department head is associated with
- `department` (string): Department the head oversees
- `deptheadId` (string): Unique identifier for the department head
- `email` (string): Department head's email address
- `password` (string): Department head's password
- `username` (string): Department head's username

---

## departments

**Description**: Academic departments within the institution

**Fields**:
- `department` (string): Name of the department
- `dept_id` (string): Unique identifier for the department

---

## instructors

**Description**: Instructor users who teach courses

**Fields**:
- `campus` (string): Campus the instructor is associated with
- `department` (string): Department the instructor belongs to
- `email` (string): Instructor's email address
- `instructorId` (string): Unique identifier for the instructor
- `password` (string): Instructor's password
- `username` (string): Instructor's username

---

## sections

**Description**: Specific instances of courses taught by instructors in a semester

**Fields**:
- `assessments` (object): Collection of assessments for this section
  - `Quiz 1` (object): First quiz assessment
    - `assessmentId` (string): Identifier for the quiz
    - `averageScore` (number): Average score for the quiz
    - `gradeBreakdown` (object): Distribution of grades
      - `A` (number): Count of A grades
      - `B` (number): Count of B grades
      - `C` (number): Count of C grades
      - `D` (number): Count of D grades
      - `F` (number): Count of F grades
    - `title` (string): Title of the assessment
  - `Midterm Exam` (object): Midterm examination
    - `assessmentId` (string): Identifier for the midterm
    - `averageScore` (number): Average score for the midterm
    - `gradeBreakdown` (object): Distribution of grades
      - `A` (number): Count of A grades
      - `B` (number): Count of B grades
      - `C` (number): Count of C grades
      - `D` (number): Count of D grades
      - `F` (number): Count of F grades
    - `title` (string): Title of the assessment
  - `Final Exam` (object): Final examination
    - `assessmentId` (string): Identifier for the final exam
    - `averageScore` (number): Average score for the final exam
    - `gradeBreakdown` (object): Distribution of grades
      - `A` (number): Count of A grades
      - `B` (number): Count of B grades
      - `C` (number): Count of C grades
      - `D` (number): Count of D grades
      - `F` (number): Count of F grades
    - `title` (string): Title of the assessment
- `averageGrade` (number): Overall average grade for the section (calculated from assessments)
- `campus` (string): Campus where the section is taught
- `campusId` (string): Campus ID where the section is taught
- `courseCode` (string): Code of the course (e.g., "AM028")
- `courseId` (string): Identifier of the course
- `crn` (string): Course Reference Number (unique identifier for the section)
- `department` (string): Department offering the course
- `instructorId` (string): Identifier of the instructor teaching the section
- `instructorName` (string): Name of the instructor teaching the section
- `sectionId` (string): Unique identifier for the section
- `semesterId` (string): Identifier of the semester when the section is offered

---

## semesters

**Description**: Academic semesters

**Fields**:
- `semester` (string): Name of the semester (e.g., "Fall 2024")
- `semesterId` (string): Unique identifier for the semester

---

## students

**Description**: Student users enrolled in courses

**Fields**:
- `studentName` (string): Name of the student
