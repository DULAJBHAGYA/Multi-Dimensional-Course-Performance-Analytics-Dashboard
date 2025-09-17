"""
Firebase Firestore service for database operations
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.firebase_config import get_firestore_client

class FirebaseService:
    def __init__(self):
        self.db = get_firestore_client()
    
    # User Operations
    async def create_user(self, user_data: Dict[str, Any]) -> str:
        """Create a new user in Firestore"""
        try:
            doc_ref = self.db.collection('users').add(user_data)
            return doc_ref[1].id
        except Exception as e:
            raise Exception(f"Error creating user: {e}")
    
    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            doc = self.db.collection('users').document(user_id).get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            raise Exception(f"Error getting user: {e}")
    
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        try:
            users = self.db.collection('users').where('email', '==', email).limit(1).stream()
            for user in users:
                return user.to_dict()
            return None
        except Exception as e:
            raise Exception(f"Error getting user by email: {e}")
    
    async def update_user(self, user_id: str, user_data: Dict[str, Any]) -> bool:
        """Update user data"""
        try:
            self.db.collection('users').document(user_id).update(user_data)
            return True
        except Exception as e:
            raise Exception(f"Error updating user: {e}")
    
    async def delete_user(self, user_id: str) -> bool:
        """Delete user"""
        try:
            self.db.collection('users').document(user_id).delete()
            return True
        except Exception as e:
            raise Exception(f"Error deleting user: {e}")
    
    async def get_all_users(self) -> List[Dict[str, Any]]:
        """Get all users"""
        try:
            users = []
            docs = self.db.collection('users').stream()
            for doc in docs:
                user_data = doc.to_dict()
                user_data['id'] = doc.id
                users.append(user_data)
            return users
        except Exception as e:
            raise Exception(f"Error getting all users: {e}")
    
    # Course Operations
    async def create_course(self, course_data: Dict[str, Any]) -> str:
        """Create a new course in Firestore"""
        try:
            doc_ref = self.db.collection('courses').add(course_data)
            return doc_ref[1].id
        except Exception as e:
            raise Exception(f"Error creating course: {e}")
    
    async def get_course(self, course_id: str) -> Optional[Dict[str, Any]]:
        """Get course by ID"""
        try:
            doc = self.db.collection('courses').document(course_id).get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            raise Exception(f"Error getting course: {e}")
    
    async def get_all_courses(self) -> List[Dict[str, Any]]:
        """Get all courses"""
        try:
            courses = []
            docs = self.db.collection('courses').stream()
            for doc in docs:
                course_data = doc.to_dict()
                course_data['id'] = doc.id
                courses.append(course_data)
            return courses
        except Exception as e:
            raise Exception(f"Error getting all courses: {e}")
    
    async def update_course(self, course_id: str, course_data: Dict[str, Any]) -> bool:
        """Update course data"""
        try:
            self.db.collection('courses').document(course_id).update(course_data)
            return True
        except Exception as e:
            raise Exception(f"Error updating course: {e}")
    
    async def delete_course(self, course_id: str) -> bool:
        """Delete course"""
        try:
            self.db.collection('courses').document(course_id).delete()
            return True
        except Exception as e:
            raise Exception(f"Error deleting course: {e}")
    
    # Analytics Operations
    async def create_analytics_data(self, analytics_data: Dict[str, Any]) -> str:
        """Create analytics data"""
        try:
            doc_ref = self.db.collection('analytics').add(analytics_data)
            return doc_ref[1].id
        except Exception as e:
            raise Exception(f"Error creating analytics data: {e}")
    
    async def get_analytics_data(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Get analytics data with optional filters"""
        try:
            query = self.db.collection('analytics')
            
            if filters:
                for key, value in filters.items():
                    query = query.where(key, '==', value)
            
            analytics = []
            docs = query.stream()
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                analytics.append(data)
            return analytics
        except Exception as e:
            raise Exception(f"Error getting analytics data: {e}")
    
    # Course Assignment Operations
    async def create_course_assignment(self, assignment_data: Dict[str, Any]) -> str:
        """Create course assignment"""
        try:
            doc_ref = self.db.collection('course_assignments').add(assignment_data)
            return doc_ref[1].id
        except Exception as e:
            raise Exception(f"Error creating course assignment: {e}")
    
    async def get_course_assignments(self, instructor_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get course assignments, optionally filtered by instructor"""
        try:
            query = self.db.collection('course_assignments')
            
            if instructor_id:
                query = query.where('instructor_id', '==', instructor_id)
            
            assignments = []
            docs = query.stream()
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                assignments.append(data)
            return assignments
        except Exception as e:
            raise Exception(f"Error getting course assignments: {e}")
    
    # Dashboard Data Operations
    async def get_dashboard_metrics(self, user_id: str, user_role: str) -> Dict[str, Any]:
        """Get dashboard metrics based on user role"""
        try:
            if user_role == 'admin':
                return await self._get_admin_dashboard_metrics()
            else:
                return await self._get_instructor_dashboard_metrics(user_id)
        except Exception as e:
            raise Exception(f"Error getting dashboard metrics: {e}")
    
    async def _get_admin_dashboard_metrics(self) -> Dict[str, Any]:
        """Get admin dashboard metrics"""
        try:
            # Get total counts
            users = await self.get_all_users()
            courses = await self.get_all_courses()
            
            # Calculate metrics
            total_students = sum(1 for user in users if user.get('role') == 'instructor')
            total_courses = len(courses)
            total_instructors = sum(1 for user in users if user.get('role') == 'instructor')
            
            # Get analytics data for performance metrics
            analytics = await self.get_analytics_data()
            
            return {
                'total_students': total_students,
                'total_courses': total_courses,
                'total_instructors': total_instructors,
                'overall_pass_rate': 85.5,  # This would be calculated from analytics
                'at_risk_students': 12,     # This would be calculated from analytics
                'analytics_data': analytics[:10]  # Recent analytics
            }
        except Exception as e:
            raise Exception(f"Error getting admin dashboard metrics: {e}")
    
    async def _get_instructor_dashboard_metrics(self, user_id: str) -> Dict[str, Any]:
        """Get instructor dashboard metrics"""
        try:
            # Get user's courses
            assignments = await self.get_course_assignments(user_id)
            course_ids = [assignment['course_id'] for assignment in assignments]
            
            # Get analytics for user's courses
            analytics = []
            for course_id in course_ids:
                course_analytics = await self.get_analytics_data({'course_id': course_id})
                analytics.extend(course_analytics)
            
            # Calculate metrics
            total_students = sum(analytics_data.get('active_students', 0) for analytics_data in analytics)
            active_courses = len(course_ids)
            avg_performance = sum(analytics_data.get('completion_rate', 0) for analytics_data in analytics) / len(analytics) if analytics else 0
            completion_rate = avg_performance
            
            return {
                'total_students': total_students,
                'active_courses': active_courses,
                'avg_performance': round(avg_performance, 1),
                'completion_rate': round(completion_rate, 1),
                'analytics_data': analytics
            }
        except Exception as e:
            raise Exception(f"Error getting instructor dashboard metrics: {e}")

# Global Firebase service instance
firebase_service = FirebaseService()
