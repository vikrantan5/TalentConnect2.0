"""
Skill Suggestion Service - Provides intelligent skill recommendations
Combines predefined skill mapping with AI-powered suggestions using Groq
"""
import os
import logging
from typing import List, Dict, Set
from groq import Groq
import json

logger = logging.getLogger(__name__)

class SkillSuggestionService:
    """Service for generating skill suggestions based on user's existing skills"""
    
    def __init__(self):
        # Comprehensive predefined skill mapping
        self.skill_mapping = {
            # Programming Languages
            'python': ['Django', 'Flask', 'FastAPI', 'Machine Learning', 'Data Science', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Web Scraping', 'Automation'],
            'javascript': ['React', 'Node.js', 'TypeScript', 'Vue.js', 'Angular', 'Express.js', 'Next.js', 'Redux', 'GraphQL', 'MongoDB'],
            'typescript': ['React', 'Angular', 'Node.js', 'Next.js', 'NestJS', 'GraphQL', 'Type Safety', 'Advanced Types'],
            'java': ['Spring Boot', 'Android Development', 'Kotlin', 'Maven', 'Hibernate', 'Microservices', 'JPA'],
            'c++': ['Data Structures', 'Algorithms', 'Game Development', 'System Programming', 'OpenGL', 'Qt'],
            'c#': ['.NET', 'ASP.NET', 'Unity', 'Game Development', 'WPF', 'Xamarin'],
            'go': ['Microservices', 'Docker', 'Kubernetes', 'Backend Development', 'gRPC', 'Concurrency'],
            'rust': ['Systems Programming', 'WebAssembly', 'Embedded Systems', 'Memory Safety'],
            'ruby': ['Ruby on Rails', 'Backend Development', 'Web Development', 'Sinatra'],
            'php': ['Laravel', 'WordPress', 'Symfony', 'Backend Development', 'MySQL'],
            'swift': ['iOS Development', 'SwiftUI', 'UIKit', 'Xcode', 'App Development'],
            'kotlin': ['Android Development', 'Jetpack Compose', 'Ktor', 'Multiplatform'],
            
            # Web Development
            'html': ['CSS', 'JavaScript', 'Web Design', 'Responsive Design', 'Accessibility'],
            'css': ['Sass', 'Tailwind CSS', 'Bootstrap', 'CSS Grid', 'Flexbox', 'Animations'],
            'react': ['Next.js', 'Redux', 'TypeScript', 'React Native', 'Hooks', 'Context API', 'React Router'],
            'vue.js': ['Nuxt.js', 'Vuex', 'Vue Router', 'Composition API'],
            'angular': ['TypeScript', 'RxJS', 'NgRx', 'Angular Material'],
            'node.js': ['Express.js', 'NestJS', 'MongoDB', 'PostgreSQL', 'REST API', 'GraphQL', 'WebSockets'],
            'next.js': ['React', 'TypeScript', 'Server-Side Rendering', 'Static Site Generation', 'API Routes'],
            
            # Mobile Development
            'react native': ['React', 'Mobile Development', 'iOS Development', 'Android Development', 'Expo'],
            'flutter': ['Android Development', 'iOS Development', 'Dart', 'Firebase', 'Material Design', 'State Management', 'API Integration'],
            'android development': ['Kotlin', 'Java', 'Jetpack Compose', 'Material Design', 'Firebase', 'Room Database'],
            'ios development': ['Swift', 'SwiftUI', 'UIKit', 'Xcode', 'Core Data', 'CloudKit'],
            
            # Backend & Databases
            'django': ['Python', 'REST API', 'PostgreSQL', 'Django REST Framework', 'Celery'],
            'flask': ['Python', 'REST API', 'SQLAlchemy', 'Jinja2'],
            'fastapi': ['Python', 'REST API', 'Async Programming', 'Pydantic', 'OpenAPI'],
            'express.js': ['Node.js', 'REST API', 'MongoDB', 'Middleware', 'Authentication'],
            'spring boot': ['Java', 'Microservices', 'REST API', 'JPA', 'Spring Security'],
            'sql': ['PostgreSQL', 'MySQL', 'Database Design', 'Query Optimization', 'Indexing'],
            'postgresql': ['SQL', 'Database Design', 'Performance Tuning', 'Backup & Recovery'],
            'mongodb': ['NoSQL', 'Database Design', 'Aggregation', 'Mongoose', 'Atlas'],
            'mysql': ['SQL', 'Database Design', 'Stored Procedures', 'Triggers'],
            'redis': ['Caching', 'Session Management', 'Pub/Sub', 'Data Structures'],
            'firebase': ['Cloud Firestore', 'Authentication', 'Cloud Functions', 'Hosting', 'Realtime Database'],
            
            # Data Science & AI
            'machine learning': ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Neural Networks', 'Deep Learning'],
            'data science': ['Python', 'Pandas', 'NumPy', 'Matplotlib', 'Jupyter', 'Statistics', 'Machine Learning'],
            'tensorflow': ['Machine Learning', 'Deep Learning', 'Neural Networks', 'Keras', 'Computer Vision'],
            'pytorch': ['Machine Learning', 'Deep Learning', 'Neural Networks', 'Computer Vision', 'NLP'],
            'data analysis': ['Python', 'Pandas', 'Excel', 'SQL', 'Tableau', 'Power BI'],
            'nlp': ['Python', 'NLTK', 'spaCy', 'Transformers', 'Text Processing'],
            
            # DevOps & Cloud
            'docker': ['Kubernetes', 'Container Orchestration', 'DevOps', 'CI/CD', 'Microservices'],
            'kubernetes': ['Docker', 'Container Orchestration', 'DevOps', 'Helm', 'Service Mesh'],
            'aws': ['EC2', 'S3', 'Lambda', 'CloudFormation', 'RDS', 'DevOps'],
            'azure': ['Cloud Computing', 'DevOps', 'Azure Functions', 'Azure SQL'],
            'gcp': ['Google Cloud', 'Cloud Functions', 'BigQuery', 'Kubernetes Engine'],
            'ci/cd': ['Jenkins', 'GitHub Actions', 'GitLab CI', 'Docker', 'Automation'],
            'git': ['GitHub', 'GitLab', 'Version Control', 'Git Workflow', 'CI/CD'],
            
            # Design
            'ui/ux design': ['Figma', 'Adobe XD', 'User Research', 'Wireframing', 'Prototyping'],
            'figma': ['UI/UX Design', 'Prototyping', 'Design Systems', 'Collaboration'],
            'photoshop': ['Graphic Design', 'Photo Editing', 'Digital Art', 'UI Design'],
            'illustrator': ['Graphic Design', 'Vector Graphics', 'Logo Design', 'Illustration'],
            
            # Other Technologies
            'blockchain': ['Smart Contracts', 'Solidity', 'Web3', 'Cryptocurrency', 'DeFi'],
            'graphql': ['Apollo', 'REST API', 'API Design', 'TypeScript', 'Schema Design'],
            'rest api': ['API Design', 'Authentication', 'Documentation', 'Postman', 'Swagger'],
            'microservices': ['Docker', 'Kubernetes', 'API Gateway', 'Service Mesh', 'Distributed Systems'],
            'testing': ['Jest', 'Pytest', 'Unit Testing', 'Integration Testing', 'TDD'],
        }
        
        # Initialize Groq client
        self.groq_api_key = os.environ.get('GROQ_API_KEY')
        self.groq_client = Groq(api_key=self.groq_api_key) if self.groq_api_key else None
        
    def get_predefined_suggestions(self, user_skills: List[str], limit: int = 10) -> List[Dict]:
        """
        Get skill suggestions based on predefined mapping
        
        Args:
            user_skills: List of skills user already has (Can Teach)
            limit: Maximum number of suggestions to return
            
        Returns:
            List of suggested skills with metadata
        """
        suggestions = set()
        skill_sources = {}  # Track which user skill led to each suggestion
        
        # Normalize user skills to lowercase for matching
        normalized_user_skills = {skill.lower(): skill for skill in user_skills}
        
        # Find related skills from mapping
        for user_skill_lower, user_skill_original in normalized_user_skills.items():
            if user_skill_lower in self.skill_mapping:
                related_skills = self.skill_mapping[user_skill_lower]
                for related in related_skills:
                    # Don't suggest skills user already has
                    if related.lower() not in normalized_user_skills:
                        suggestions.add(related)
                        if related not in skill_sources:
                            skill_sources[related] = []
                        skill_sources[related].append(user_skill_original)
        
        # Create suggestion objects with metadata
        suggestion_list = []
        for skill in list(suggestions)[:limit]:
            sources = skill_sources.get(skill, [])
            suggestion_list.append({
                'skill_name': skill,
                'category': self._categorize_skill(skill),
                'description': f"Based on your knowledge of {', '.join(sources[:2])}",
                'source': 'predefined',
                'related_to': sources
            })
        
        return suggestion_list
    
    def get_ai_suggestions(self, user_skills: List[str], limit: int = 5) -> List[Dict]:
        """
        Get AI-powered skill suggestions using Groq
        
        Args:
            user_skills: List of skills user already has
            limit: Maximum number of suggestions
            
        Returns:
            List of AI-generated skill suggestions
        """
        if not self.groq_client:
            logger.warning("Groq API key not configured, skipping AI suggestions")
            return []
        
        try:
            prompt = f"""You are a career development AI assistant. Given a user's current skills, suggest {limit} complementary skills they should learn next to advance their career.

User's current skills: {', '.join(user_skills)}

Provide {limit} skill suggestions that:
1. Build upon their existing knowledge
2. Are in-demand in the job market
3. Create a well-rounded skill set
4. Open new career opportunities

Return ONLY a JSON array with this exact format:
[
  {{
    "skill_name": "Skill Name",
    "category": "Category (e.g., Web Development, Data Science, etc.)",
    "description": "Brief description of why this skill is valuable",
    "difficulty": "beginner/intermediate/advanced"
  }}
]

Return only valid JSON, no additional text."""

            response = self.groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a helpful career development assistant. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                model=os.environ.get('GROQ_MODEL', 'llama-3.3-70b-versatile'),
                temperature=0.7,
                max_tokens=1000
            )
            
            ai_response = response.choices[0].message.content.strip()
            
            # Extract JSON from response (in case there's extra text)
            start_idx = ai_response.find('[')
            end_idx = ai_response.rfind(']') + 1
            if start_idx != -1 and end_idx > start_idx:
                json_str = ai_response[start_idx:end_idx]
                suggestions = json.loads(json_str)
                
                # Add source metadata
                for suggestion in suggestions:
                    suggestion['source'] = 'ai'
                
                return suggestions[:limit]
            else:
                logger.error(f"No valid JSON array found in AI response: {ai_response}")
                return []
                
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing AI suggestions JSON: {str(e)}")
            return []
        except Exception as e:
            logger.error(f"Error getting AI suggestions: {str(e)}")
            return []
    
    def get_combined_suggestions(self, user_skills: List[str], include_ai: bool = True) -> List[Dict]:
        """
        Get combined suggestions from both predefined mapping and AI
        
        Args:
            user_skills: List of skills user has
            include_ai: Whether to include AI-powered suggestions
            
        Returns:
            Combined list of suggestions, AI suggestions first
        """
        suggestions = []
        
        # Get predefined suggestions first
        predefined = self.get_predefined_suggestions(user_skills, limit=10)
        
        # Get AI suggestions if enabled
        if include_ai:
            ai_suggestions = self.get_ai_suggestions(user_skills, limit=5)
            # AI suggestions go first (they're often more relevant)
            suggestions.extend(ai_suggestions)
        
        # Add predefined suggestions
        suggestions.extend(predefined)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_suggestions = []
        for suggestion in suggestions:
            skill_name_lower = suggestion['skill_name'].lower()
            if skill_name_lower not in seen:
                seen.add(skill_name_lower)
                unique_suggestions.append(suggestion)
        
        return unique_suggestions[:15]  # Limit to 15 total suggestions
    
    def _categorize_skill(self, skill: str) -> str:
        """Categorize a skill based on its type"""
        skill_lower = skill.lower()
        
        if any(lang in skill_lower for lang in ['python', 'java', 'javascript', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'go', 'rust']):
            return 'Programming Languages'
        elif any(web in skill_lower for web in ['react', 'vue', 'angular', 'html', 'css', 'sass', 'tailwind', 'bootstrap']):
            return 'Frontend Development'
        elif any(backend in skill_lower for backend in ['django', 'flask', 'fastapi', 'express', 'spring', 'node']):
            return 'Backend Development'
        elif any(db in skill_lower for db in ['sql', 'mongodb', 'postgresql', 'mysql', 'redis', 'database']):
            return 'Databases'
        elif any(mobile in skill_lower for mobile in ['android', 'ios', 'flutter', 'react native', 'mobile']):
            return 'Mobile Development'
        elif any(data in skill_lower for data in ['machine learning', 'data science', 'tensorflow', 'pytorch', 'pandas', 'numpy']):
            return 'Data Science & AI'
        elif any(devops in skill_lower for devops in ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'ci/cd', 'devops']):
            return 'DevOps & Cloud'
        elif any(design in skill_lower for design in ['ui/ux', 'figma', 'photoshop', 'illustrator', 'design']):
            return 'Design'
        else:
            return 'Technology'


# Global instance
skill_suggestion_service = SkillSuggestionService()
