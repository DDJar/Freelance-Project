import React from 'react';
import './TeamSection.scss';

interface TeamMember {
    name: string;
    position: string;
}

const TeamSection: React.FC = () => {
    const teamMembers: TeamMember[] = [
        { name: 'Nguyễn Văn Sơn', position: 'Tổng giám đốc' },
        { name: 'Nguyễn Quang Anh', position: 'Giám sát thi công' },
        { name: 'Nguyễn Thị Thắm', position: 'Trưởng phòng kế toán' },
        { name: 'Nguyễn Thu Trang', position: 'Giám đốc truyền thông tiếp thị' }
    ];

    return (
        <section className="team-section">
            <div className="dx-container">
                <div className="section-header">
                    <h2 className="section-title">TẬN TÂM, CHUYÊN NGHIỆP</h2>
                    <h3 className="section-subtitle">Đội ngũ của chúng tôi</h3>
                    <div className="divider" />
                </div>

                <div className="team-grid">
                    {teamMembers.map((member, index) => (
                        <div key={index} className="team-card">
                            <div className="member-avatar">
                                {/* Placeholder hoặc hình ảnh thực tế */}
                                <div className="avatar-placeholder">
                                    {member.name.charAt(0)}
                                </div>
                            </div>
                            <div className="member-info">
                                <h4 className="member-name">{member.name}</h4>
                                <p className="member-position">{member.position}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TeamSection;