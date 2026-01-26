import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/api';
import { Loading, ErrorMessage } from '../components/Loading';
import './ProfilePage.css';

function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    favorite_genres: '',
    favorite_movies: '',
    favorite_directors: '',
    favorite_actors: '',
    bio: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await profileService.get();
      setProfile({
        favorite_genres: response.data.favorite_genres || '',
        favorite_movies: response.data.favorite_movies || '',
        favorite_directors: response.data.favorite_directors || '',
        favorite_actors: response.data.favorite_actors || '',
        bio: response.data.bio || ''
      });
    } catch (err) {
      console.error('Erro ao carregar perfil:', err);
      setError('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      await profileService.update(profile);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      setError('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="profile-page container">
        <Loading />
      </div>
    );
  }

  return (
    <div className="profile-page container">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {getInitials(user?.name)}
          </div>
          <div className="profile-info">
            <h1>{user?.name}</h1>
            <p>{user?.email}</p>
          </div>
        </div>

        {error && <ErrorMessage message={error} />}
        {success && <div className="success-message">✓ Perfil atualizado com sucesso!</div>}

        <div className="profile-section">
          <h2><span>⭐</span> Preferências</h2>
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Gêneros Favoritos</label>
              <input
                type="text"
                name="favorite_genres"
                value={profile.favorite_genres}
                onChange={handleChange}
                placeholder="Ex: Ficção Científica, Drama, Comédia"
              />
            </div>

            <div className="form-group">
              <label>Filmes/Séries Favoritos</label>
              <input
                type="text"
                name="favorite_movies"
                value={profile.favorite_movies}
                onChange={handleChange}
                placeholder="Ex: Matrix, Breaking Bad, Inception"
              />
            </div>

            <div className="form-group">
              <label>Diretores Favoritos</label>
              <input
                type="text"
                name="favorite_directors"
                value={profile.favorite_directors}
                onChange={handleChange}
                placeholder="Ex: Christopher Nolan, Quentin Tarantino"
              />
            </div>

            <div className="form-group">
              <label>Atores/Atrizes Favoritos</label>
              <input
                type="text"
                name="favorite_actors"
                value={profile.favorite_actors}
                onChange={handleChange}
                placeholder="Ex: Tom Hanks, Meryl Streep"
              />
            </div>

            <div className="form-group">
              <label>Bio</label>
              <textarea
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                placeholder="Conte um pouco sobre você e seus gostos..."
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-save" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
