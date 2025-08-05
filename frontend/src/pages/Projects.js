import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import './Projects.css';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectStack, setNewProjectStack] = useState('');
  const [newProjectRepoUrl, setNewProjectRepoUrl] = useState('');
  const [newProjectTags, setNewProjectTags] = useState('');
  const [newProjectVisible, setNewProjectVisible] = useState(true);
  const [canCreateProject, setCanCreateProject] = useState(false);

  const fetchProjects = () => {
    console.log("Fetching projects...");
    apiClient.get('/projects').then(response => {
      console.log("Projects fetched successfully:", response.data);
      setProjects(response.data);
    }).catch(error => {
      console.error("Error fetching projects:", error.response ? error.response.data : error.message);
    });
  };

  useEffect(() => {
    fetchProjects();
    // Verifica permissão via API
    apiClient.get('/projects/can-create').then(response => {
      setCanCreateProject(response.data.can_create === true);
    }).catch(() => {
      setCanCreateProject(false);
    });
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    console.log("Creating project:", {
      name: newProjectName,
      description: newProjectDescription,
      stack: newProjectStack.split(',').map(s => s.trim()), // Split by comma and trim whitespace
      repo_url: newProjectRepoUrl,
      tags: newProjectTags.split(',').map(t => t.trim()), // Split by comma and trim whitespace
      visible: newProjectVisible,
    });
    try {
      await apiClient.post('/projects', {
        name: newProjectName,
        description: newProjectDescription,
        stack: newProjectStack.split(',').map(s => s.trim()),
        repo_url: newProjectRepoUrl,
        tags: newProjectTags.split(',').map(t => t.trim()),
        visible: newProjectVisible,
      });
      console.log("Project created successfully.");
      setNewProjectName('');
      setNewProjectDescription('');
      setNewProjectStack('');
      setNewProjectRepoUrl('');
      setNewProjectTags('');
      setNewProjectVisible(true);
      fetchProjects(); // Refresh the list of projects
    } catch (error) {
      console.error("Error creating project:", error.response ? error.response.data : error.message);
      alert("Error creating project. Check console for details. You might not be authorized.");
    }
  };

  return (
    <div className="page-content-container">
      <h2 className="projects-header">Meus Projetos</h2>
      {canCreateProject && (
        <div className="create-project-card">
          <h3>Criar Novo Projeto</h3>
          <form onSubmit={handleCreateProject}>
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
                className="form-textarea"
                id="projectDescription"
                rows="3"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                required
              ></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="projectStack" className="form-label">Stack (separado por vírgulas)</label>
              <input
                type="text"
                className="form-input"
                id="projectStack"
                value={newProjectStack}
                onChange={(e) => setNewProjectStack(e.target.value)}
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
            <button type="submit" className="submit-button">Criar Projeto</button>
          </form>
        </div>
      )}

      <div className="projects-grid">
        {projects.length > 0 ? (
          projects.map(project => (
            <div className="project-card" key={project.id}>
              <h5>{project.name}</h5>
              <p>{project.description}</p>
              <p><strong>Stack:</strong> {project.stack.join(', ')}</p>
              <p><strong>Tags:</strong> {project.tags.join(', ')}</p>
              <p><a href={project.repo_url} target="_blank" rel="noopener noreferrer">Repositório</a></p>
            </div>
          ))
        ) : (
          <div className="no-projects-message">
            Nenhum projeto encontrado. Crie um novo!
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;