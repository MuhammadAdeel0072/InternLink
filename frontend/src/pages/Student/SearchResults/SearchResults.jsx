import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from "../../../services/api";
import Loader from "../../../components/Loader/Loader";
import styles from './SearchResults.module.css';
import { User, Briefcase, FileText, MapPin, Search, X } from 'lucide-react';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    if (query) {
      fetchResults(query);
      setSearchInput(query);
    }
  }, [query]);

  const fetchResults = async (q) => {
    try {
      setLoading(true);
      const res = await api.get(`/search?q=${encodeURIComponent(q)}`);
      setResults(res.data);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput)}`);
    }
  };

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'people', label: 'People', count: results?.people?.length || 0 },
    { key: 'jobs', label: 'Jobs', count: results?.jobs?.length || 0 },
    { key: 'posts', label: 'Posts', count: results?.posts?.length || 0 },
  ];

  return (
    <div className={styles.container}>
      
      {/* Search Bar */}
      <div className={styles.searchBar}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.searchInputWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search InternLink..."
              className={styles.searchInput}
            />
            {searchInput && (
              <button type="button" onClick={() => { setSearchInput(''); navigate('/search'); }} className={styles.clearBtn}>
                <X size={18} />
              </button>
            )}
          </div>
          <button type="submit" className={`btn btn-primary ${styles.searchBtn}`}>
            Search
          </button>
        </form>
      </div>

      {/* Tabs */}
      <div className={styles.tabBar}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
          >
            {tab.label}
            {tab.count > 0 && <span className={styles.tabCount}>({tab.count})</span>}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <Loader />
      ) : results ? (
        <div className={styles.results}>
          
          {/* People */}
          {(activeTab === 'all' || activeTab === 'people') && results.people?.length > 0 && (
            <div className={styles.section}>
              {activeTab === 'all' && <h3 className={styles.sectionTitle}><User size={16} /> People</h3>}
              {results.people.map(person => (
                <div key={person._id} className={`card ${styles.resultCard}`}
                  onClick={() => navigate(`/profile/${person._id}`)}>
                  <div className={styles.resultRow}>
                    <div className={styles.avatar}>
                      {person.avatar ? <img src={person.avatar} alt="" /> : person.name?.charAt(0)}
                    </div>
                    <div>
                      <h4 className={styles.resultName}>{person.name}</h4>
                      <p className={styles.resultSub}>{person.headline || person.role}</p>
                      {person.university && <p className={styles.resultMeta}>🎓 {person.university}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Jobs */}
          {(activeTab === 'all' || activeTab === 'jobs') && results.jobs?.length > 0 && (
            <div className={styles.section}>
              {activeTab === 'all' && <h3 className={styles.sectionTitle}><Briefcase size={16} /> Jobs</h3>}
              {results.jobs.map(job => (
                <div key={job._id} className={`card ${styles.resultCard}`}
                  onClick={() => navigate('/jobs')}>
                  <h4 className={styles.resultName}>{job.title}</h4>
                  <p className={styles.resultSub}>{job.company}</p>
                  <div className={styles.jobMeta}>
                    <span><MapPin size={11} /> {job.location}</span>
                    {job.salaryRange && <span>💰 {job.salaryRange}</span>}
                    <span className="badge badge-info">{job.jobType}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Posts */}
          {(activeTab === 'all' || activeTab === 'posts') && results.posts?.length > 0 && (
            <div className={styles.section}>
              {activeTab === 'all' && <h3 className={styles.sectionTitle}><FileText size={16} /> Posts</h3>}
              {results.posts.map(post => (
                <div key={post._id} className={`card ${styles.resultCard}`}
                  onClick={() => navigate('/')}>
                  <p className={styles.postContent}>{post.content}</p>
                  <div className={styles.postMeta}>
                    <span>by {post.author}</span>
                    <span>{post.likes} likes • {post.comments} comments</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No results */}
          {!results.people?.length && !results.jobs?.length && !results.posts?.length && (
            <div className={styles.noResults}>
              <Search size={48} />
              <p>No results found for "{query}"</p>
              <p>Try different keywords or check your spelling</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default SearchResults;