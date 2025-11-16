import React from 'react';

const WebsiteUI = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '20px 40px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#6366f1', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '20px' }}>
              L
            </div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>
              LearnHub
            </h1>
          </div>
          <nav style={{ display: 'flex', gap: '30px' }}>
            <a href="#" style={{ color: '#64748b', textDecoration: 'none', fontWeight: '500', fontSize: '16px' }}>Courses</a>
            <a href="#" style={{ color: '#64748b', textDecoration: 'none', fontWeight: '500', fontSize: '16px' }}>About</a>
            <a href="#" style={{ color: '#64748b', textDecoration: 'none', fontWeight: '500', fontSize: '16px' }}>Contact</a>
            <button style={{
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              Sign In
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '80px 40px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '56px', margin: '0 0 20px 0', fontWeight: 'bold', lineHeight: '1.2' }}>
            Master New Skills Today
          </h2>
          <p style={{ fontSize: '20px', margin: '0 0 30px 0', opacity: 0.95 }}>
            Join thousands of learners and unlock your potential with our interactive courses
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button style={{
              backgroundColor: 'white',
              color: '#6366f1',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '16px'
            }}>
              Start Learning
            </button>
            <button style={{
              backgroundColor: 'transparent',
              color: 'white',
              border: '2px solid white',
              padding: '14px 32px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '16px'
            }}>
              Browse Courses
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '60px 20px'
      }}>
        {/* Features Section */}
        <section style={{ marginBottom: '80px' }}>
          <h3 style={{ fontSize: '36px', textAlign: 'center', marginBottom: '50px', color: '#1e293b' }}>
            Why Choose LearnHub?
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px'
          }}>
            {[
              { icon: '📚', title: 'Expert Instructors', desc: 'Learn from industry professionals' },
              { icon: '⚡', title: 'Interactive Content', desc: 'Engaging lessons and hands-on projects' },
              { icon: '🎯', title: 'Flexible Learning', desc: 'Study at your own pace, anytime' },
              { icon: '🏆', title: 'Certificates', desc: 'Earn certificates upon completion' }
            ].map((feature, idx) => (
              <div key={idx} style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                textAlign: 'center',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>{feature.icon}</div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '22px', color: '#1e293b' }}>{feature.title}</h4>
                <p style={{ margin: 0, color: '#64748b', fontSize: '16px' }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Course Cards */}
        <section style={{ marginBottom: '80px' }}>
          <h3 style={{ fontSize: '36px', marginBottom: '30px', color: '#1e293b' }}>
            Popular Courses
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {[
              { title: 'Web Development Bootcamp', category: 'Programming', students: '12.5k', rating: '4.8', color: '#3b82f6' },
              { title: 'Data Science Mastery', category: 'Data Science', students: '8.2k', rating: '4.9', color: '#10b981' },
              { title: 'UI/UX Design Fundamentals', category: 'Design', students: '15.3k', rating: '4.7', color: '#8b5cf6' },
              { title: 'Machine Learning Basics', category: 'AI/ML', students: '9.8k', rating: '4.8', color: '#f59e0b' },
              { title: 'Mobile App Development', category: 'Programming', students: '11.1k', rating: '4.6', color: '#ec4899' },
              { title: 'Digital Marketing Course', category: 'Marketing', students: '7.5k', rating: '4.9', color: '#06b6d4' }
            ].map((course, idx) => (
              <div key={idx} style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              }}
              >
                <div style={{
                  height: '180px',
                  backgroundColor: course.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '64px'
                }}>
                  📖
                </div>
                <div style={{ padding: '24px' }}>
                  <div style={{
                    display: 'inline-block',
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginBottom: '12px'
                  }}>
                    {course.category}
                  </div>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '20px', color: '#1e293b', fontWeight: '600' }}>
                    {course.title}
                  </h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px' }}>
                      <span>⭐ {course.rating}</span>
                      <span>•</span>
                      <span>👥 {course.students}</span>
                    </div>
                    <span style={{ color: '#6366f1', fontWeight: '600', fontSize: '18px' }}>$49</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section style={{
          backgroundColor: '#f8fafc',
          padding: '60px 40px',
          borderRadius: '16px',
          marginBottom: '80px'
        }}>
          <h3 style={{ fontSize: '36px', textAlign: 'center', marginBottom: '50px', color: '#1e293b' }}>
            What Our Students Say
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px'
          }}>
            {[
              { name: 'Sarah Johnson', role: 'Software Engineer', text: 'The courses are amazing! I landed my dream job after completing the Web Development Bootcamp.' },
              { name: 'Michael Chen', role: 'Data Analyst', text: 'Best investment I\'ve made. The instructors are knowledgeable and the content is top-notch.' },
              { name: 'Emily Rodriguez', role: 'UX Designer', text: 'Flexible learning schedule and practical projects. Highly recommend!' }
            ].map((testimonial, idx) => (
              <div key={idx} style={{
                backgroundColor: 'white',
                padding: '30px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '16px' }}>⭐⭐⭐⭐⭐</div>
                <p style={{ margin: '0 0 20px 0', color: '#475569', fontSize: '16px', lineHeight: '1.6' }}>
                  "{testimonial.text}"
                </p>
                <div>
                  <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>{testimonial.name}</div>
                  <div style={{ color: '#64748b', fontSize: '14px' }}>{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '60px 40px',
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '40px', margin: '0 0 20px 0', fontWeight: 'bold' }}>
            Ready to Start Learning?
          </h3>
          <p style={{ fontSize: '18px', margin: '0 0 30px 0', opacity: 0.95 }}>
            Join over 100,000 students and start your learning journey today
          </p>
          <button style={{
            backgroundColor: 'white',
            color: '#6366f1',
            border: 'none',
            padding: '16px 40px',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '18px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            Get Started Now
          </button>
        </section>
      </div>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#1e293b',
        color: 'white',
        padding: '60px 40px 30px',
        marginTop: '80px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '40px',
            marginBottom: '40px'
          }}>
            <div>
              <h4 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>LearnHub</h4>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>
                Empowering learners worldwide with quality education.
              </p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>Courses</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {['Web Development', 'Data Science', 'Design', 'Marketing'].map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '12px' }}>
                    <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>Company</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {['About Us', 'Careers', 'Blog', 'Contact'].map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '12px' }}>
                    <a href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600' }}>Connect</h4>
              <div style={{ display: 'flex', gap: '16px' }}>
                {['📘', '🐦', '📷', '💼'].map((icon, idx) => (
                  <a key={idx} href="#" style={{ fontSize: '24px', textDecoration: 'none' }}>{icon}</a>
                ))}
              </div>
            </div>
          </div>
          <div style={{
            borderTop: '1px solid #334155',
            paddingTop: '30px',
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: '14px'
          }}>
            <p style={{ margin: 0 }}>© 2024 LearnHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WebsiteUI;

