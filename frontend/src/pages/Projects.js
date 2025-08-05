import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectStack, setNewProjectStack] = useState('');
  const [newProjectRepoUrl, setNewProjectRepoUrl] = useState('');
  const [newProjectTags, setNewProjectTags] = useState('');
  const [newProjectVisible, setNewProjectVisible] = useState(true);

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
    <div className="container mt-5">
      <h2 className="text-center mb-4" style={{ color: '#343a40' }}>Meus Projetos</h2>

      <div className="card shadow-sm mb-5" style={{ borderRadius: '10px' }}>
        <div className="card-body">
          <h3 className="card-title mb-3" style={{ color: '#007bff' }}>Criar Novo Projeto</h3>
          <form onSubmit={handleCreateProject}>
            <div className="mb-3">
              <label htmlFor="projectName" className="form-label">Nome do Projeto</label>
              <input
                type="text"
                className="form-control" 
                id="projectName"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="projectDescription" className="form-label">Descrição</label>
              <textarea
                className="form-control"
                id="projectDescription"
                rows="3"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                required
              ></textarea>
            </div>
            <div className="mb-3">
              <label htmlFor="projectStack" className="form-label">Stack (separado por vírgulas)</label>
              <input
                type="text"
                className="form-control"
                id="projectStack"
                value={newProjectStack}
                onChange={(e) => setNewProjectStack(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="projectRepoUrl" className="form-label">URL do Repositório</label>
              <input
                type="url"
                className="form-control"
                id="projectRepoUrl"
                value={newProjectRepoUrl}
                onChange={(e) => setNewProjectRepoUrl(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="projectTags" className="form-label">Tags (separado por vírgulas)</label>
              <input
                type="text"
                className="form-control"
                id="projectTags"
                value={newProjectTags}
                onChange={(e) => setNewProjectTags(e.target.value)}
                required
              />
            </div>
            <div className="mb-3 form-check form-switch">
              <input
                type="checkbox"
                className="form-check-input"
                id="projectVisible"
                checked={newProjectVisible}
                onChange={(e) => setNewProjectVisible(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="projectVisible">Visível Publicamente</label>
            </div>
            <button type="submit" className="btn btn-primary w-100">Criar Projeto</button>
          </form>
        </div>
      </div>

      <div className="row">
        {projects.length > 0 ? (
          projects.map(project => (
            <div className="col-md-4 mb-4" key={project.id}>
              <div className="card h-100 shadow-sm" style={{ borderRadius: '10px', border: '1px solid #e0e0e0' }}>
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title" style={{ color: '#007bff' }}>{project.name}</h5>
                  <p className="card-text text-muted flex-grow-1">{project.description}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12">
            <div className="alert alert-info text-center" role="alert">
              Nenhum projeto encontrado. Crie um novo!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;