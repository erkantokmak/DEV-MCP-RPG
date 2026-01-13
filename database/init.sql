-- Dev-RPG Database Initialization Script
-- PostgreSQL 15

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- USERS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(200),
    avatar_url TEXT,
    xp_total INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- PROJECTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    repository_url TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    language VARCHAR(50),
    framework VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- ANALYSIS REPORTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS analysis_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id VARCHAR(100) UNIQUE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    commit_id VARCHAR(100),
    file_path TEXT,
    
    -- Overall scores
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    status VARCHAR(50),
    
    -- Individual MCP scores
    code_quality_score INTEGER CHECK (code_quality_score >= 0 AND code_quality_score <= 100),
    architecture_score INTEGER CHECK (architecture_score >= 0 AND architecture_score <= 100),
    event_loop_score INTEGER CHECK (event_loop_score >= 0 AND event_loop_score <= 100),
    efficiency_score INTEGER CHECK (efficiency_score >= 0 AND efficiency_score <= 100),
    
    -- Full report data (JSON)
    code_quality_report JSONB,
    architecture_report JSONB,
    event_loop_report JSONB,
    cost_report JSONB,
    
    -- RPG data
    xp_earned INTEGER DEFAULT 0,
    badges_earned TEXT[],
    
    -- Metadata
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- BADGES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_url TEXT,
    xp_reward INTEGER DEFAULT 0,
    requirement_type VARCHAR(50),
    requirement_value INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- USER BADGES (Many-to-Many)
-- ===========================================
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    report_id UUID REFERENCES analysis_reports(id),
    UNIQUE(user_id, badge_id)
);

-- ===========================================
-- LEADERBOARD VIEW
-- ===========================================
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    u.xp_total,
    u.level,
    COUNT(DISTINCT ub.badge_id) as badge_count,
    COUNT(DISTINCT ar.id) as analysis_count,
    COALESCE(AVG(ar.overall_score), 0) as avg_score
FROM users u
LEFT JOIN user_badges ub ON u.id = ub.user_id
LEFT JOIN analysis_reports ar ON ar.project_id IN (
    SELECT id FROM projects WHERE owner_id = u.id
)
GROUP BY u.id
ORDER BY u.xp_total DESC, u.level DESC;

-- ===========================================
-- INSERT DEFAULT BADGES
-- ===========================================
INSERT INTO badges (name, description, xp_reward, requirement_type, requirement_value) VALUES
    ('Clean Coder', 'Achieve 90+ code quality score', 100, 'code_quality_score', 90),
    ('Architect Master', 'Achieve 90+ architecture score', 100, 'architecture_score', 90),
    ('Async Ninja', 'Achieve 90+ event loop score', 100, 'event_loop_score', 90),
    ('Optimizer', 'Achieve 90+ efficiency score', 100, 'efficiency_score', 90),
    ('Code Legend', 'Achieve 95+ overall score', 250, 'overall_score', 95),
    ('First Analysis', 'Complete your first code analysis', 50, 'analysis_count', 1),
    ('Analysis Veteran', 'Complete 10 code analyses', 150, 'analysis_count', 10),
    ('Centurion', 'Complete 100 code analyses', 500, 'analysis_count', 100),
    ('Level 5', 'Reach level 5', 100, 'level', 5),
    ('Level 10', 'Reach level 10', 250, 'level', 10)
ON CONFLICT (name) DO NOTHING;

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_reports_project ON analysis_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_commit ON analysis_reports(commit_id);
CREATE INDEX IF NOT EXISTS idx_reports_analyzed_at ON analysis_reports(analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);

-- ===========================================
-- FUNCTION: Calculate User Level
-- ===========================================
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER) RETURNS INTEGER AS $$
BEGIN
    -- Simple level formula: Level = floor(sqrt(xp / 100)) + 1
    RETURN FLOOR(SQRT(xp / 100.0)) + 1;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- TRIGGER: Auto-update user level on XP change
-- ===========================================
CREATE OR REPLACE FUNCTION update_user_level() RETURNS TRIGGER AS $$
BEGIN
    NEW.level := calculate_level(NEW.xp_total);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_level ON users;
CREATE TRIGGER trigger_update_level
    BEFORE UPDATE OF xp_total ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_user_level();

-- ===========================================
-- GRANT PERMISSIONS
-- ===========================================
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dev_rpg_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dev_rpg_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO dev_rpg_user;
