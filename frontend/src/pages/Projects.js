import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import './Projects.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [tagSearchInput, setTagSearchInput] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectStack, setNewProjectStack] = useState('');
  const [newProjectRepoUrl, setNewProjectRepoUrl] = useState('');
  const [newProjectTags, setNewProjectTags] = useState('');
  const [newProjectVisible, setNewProjectVisible] = useState(true);
  const [editingProject, setEditingProject] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [canCreateProject, setCanCreateProject] = useState(false);

  // Extrai todas as tags únicas dos projetos
  const allTags = Array.from(new Set(projects.flatMap(p => p.tags))).filter(Boolean);
  const uniqueTags = allTags.sort();

  // Filtra tags baseado no input de pesquisa e limita a 8 tags
  const filteredTags = uniqueTags
    .filter(tag => tag.toLowerCase().includes(tagSearchInput.toLowerCase()))
    .slice(0, 8);

  const fetchProjects = () => {
    console.log("Fetching projects...");
    apiClient.get('/projects').then(response => {
      console.log("Projects fetched successfully:", response.data);
      setProjects(response.data);
    }).catch(error => {
      console.error("Error fetching projects:", error.response ? error.response.data : error.message);
    });
  };

  const checkPermissions = () => {
    console.log("Checking create project permissions...");
    apiClient.get('/projects/can-create').then(response => {
      console.log("Create permission response:", response.data);
      setCanCreateProject(response.data.can_create);
    }).catch(error => {
      console.error("Error checking permissions:", error.response ? error.response.data : error.message);
      setCanCreateProject(false);
    });
  };

  useEffect(() => {
    fetchProjects();
    checkPermissions();
  }, []);

  const createProject = async () => {
    try {
      const newProject = {
        name: newProjectName,
        description: newProjectDescription,
        stack: newProjectStack.split(',').map(tech => tech.trim()).filter(tech => tech),
        repo_url: newProjectRepoUrl,
        tags: newProjectTags.split(',').map(tag => tag.trim()).filter(tag => tag),
        visible: newProjectVisible
      };

      if (isEditing && editingProject) {
        // Update existing project
        const response = await apiClient.put(`/projects/${editingProject.id}`, newProject);

        // Update the project in the state
        const updatedProjects = projects.map(project =>
          project.id === editingProject.id ? response.data : project
        );
        setProjects(updatedProjects);

        // Reset editing state
        setIsEditing(false);
        setEditingProject(null);
      } else {
        // Create new project
        const response = await apiClient.post('/projects/', newProject);
        setProjects([...projects, response.data]);
      }

      // Reset form
      setNewProjectName('');
      setNewProjectDescription('');
      setNewProjectStack('');
      setNewProjectRepoUrl('');
      setNewProjectTags('');
      setNewProjectVisible(true);
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setIsEditing(true);
    setNewProjectName(project.name);
    setNewProjectDescription(project.description);
    setNewProjectStack(Array.isArray(project.stack) ? project.stack.join(', ') : project.stack);
    setNewProjectRepoUrl(project.repo_url);
    setNewProjectTags(project.tags.join(', '));
    setNewProjectVisible(project.visible);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingProject(null);
    setNewProjectName('');
    setNewProjectDescription('');
    setNewProjectStack('');
    setNewProjectRepoUrl('');
    setNewProjectTags('');
    setNewProjectVisible(true);
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Tem certeza que deseja deletar este projeto?')) {
      return;
    }

    try {
      console.log("Deleting project:", projectId);
      await apiClient.delete(`/projects/${projectId}`);
      console.log("Project deleted successfully");
      alert("Project deleted successfully!");
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error.response ? error.response.data : error.message);
      alert("Error deleting project. Check console for details. You might not be authorized.");
    }
  };

  return (
    <div className="page-content-container">
      <h2 className="projects-header">Meus Projetos</h2>

      {allTags.length > 0 && (
        <div className="tag-filter-container">
          <h3>Filtrar por tag:</h3>
          <div className="tag-search-container">
            <input
              type="text"
              placeholder="Pesquisar tags..."
              className="tag-search-input"
              value={tagSearchInput}
              onChange={(e) => setTagSearchInput(e.target.value)}
            />
          </div>
          <div className="tag-filter-bar">
            <button
              className={`tag-filter-button ${selectedTag === '' ? 'active' : ''}`}
              onClick={() => setSelectedTag('')}
            >
              Todas
            </button>
            {filteredTags.map(tag => (
              <button
                key={tag}
                className={`tag-filter-button ${selectedTag === tag ? 'active' : ''}`}
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </button>
            ))}
            {uniqueTags.length > 8 && (
              <span className="tags-count-info">
                Mostrando {filteredTags.length} de {uniqueTags.length} tags
              </span>
            )}
          </div>
        </div>
      )}

      <div className="projects-grid">
        {projects.length > 0 ? (
          projects
            .filter(project => selectedTag === '' || project.tags.includes(selectedTag))
            .map(project => (
              <div className="project-card" key={project.id}>
                <h5>{project.name}</h5>
                <p>{project.description}</p>
                <p><strong>Stack:</strong> {project.stack.join(', ')}</p>
                <div style={{ margin: '0.5rem 0' }}>
                  <strong>Tags:</strong>{' '}
                  <span className="project-tags">
                    {project.tags.map((tag, idx) => (
                      <span className="tag-pill" key={idx}>{tag}</span>
                    ))}
                  </span>
                </div>
                <p><a href={project.repo_url} target="_blank" rel="noopener noreferrer">Repositório</a></p>
                {canCreateProject && (
                  <div className="project-actions">
                    <button
                      className="edit-button"
                      onClick={() => handleEditProject(project)}
                      title="Editar projeto"
                    >
                      Editar
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteProject(project.id)}
                      title="Deletar projeto"
                    >
                      Deletar
                    </button>
                  </div>
                )}
              </div>
            ))
        ) : (
          <div className="no-projects-message">
            Nenhum projeto encontrado. Crie um novo!
          </div>
        )}
      </div>

      {canCreateProject && (
        <div className="project-form-card">
          <h3>{isEditing ? 'Editar projeto' : 'Adicionar novo projeto'}</h3>
          <form className="project-form" onSubmit={(e) => { e.preventDefault(); createProject(); }}>
            <div className="form-group">
              <label htmlFor="projectName" className="form-label">Nome do Projeto</label>
              <input
                type="text"
                className="form-input"
                id="projectName"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="projectDescription" className="form-label">Descrição</label>
              <textarea
                className="form-input"
                id="projectDescription"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="projectStack" className="form-label">Stack Tecnológica</label>
              <input
                type="text"
                className="form-input"
                id="projectStack"
                value={newProjectStack}
                onChange={(e) => setNewProjectStack(e.target.value)}
                placeholder="Ex: Python, React, Node.js, MongoDB (separado por vírgulas)"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="projectRepoUrl" className="form-label">URL do Repositório</label>
              <input
                type="url"
                className="form-input"
                id="projectRepoUrl"
                value={newProjectRepoUrl}
                onChange={(e) => setNewProjectRepoUrl(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="projectTags" className="form-label">Tags (separado por vírgulas)</label>
              <input
                type="text"
                className="form-input"
                id="projectTags"
                value={newProjectTags}
                onChange={(e) => setNewProjectTags(e.target.value)}
                required
              />
            </div>
            <div className="form-buttons">
              <button type="submit" className="submit-button">
                {isEditing ? 'Atualizar Projeto' : 'Criar Projeto'}
              </button>
              {isEditing && (
                <button type="button" className="cancel-button" onClick={cancelEdit}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Projects;