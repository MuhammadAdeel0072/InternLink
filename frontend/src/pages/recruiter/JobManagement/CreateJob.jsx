import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import Loader from '../../../components/Loader/Loader';
import styles from './CreateJob.module.css';
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  Eye,
  Copy,
  Plus,
  Trash2,
  GripVertical,
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Users,
  GraduationCap,
  Languages,
  Award,
  ClipboardList,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const EMPLOYMENT_TYPES = ['Internship', 'Full-time', 'Part-time', 'Contract', 'Freelance', 'Temporary'];
const WORKPLACE_TYPES = ['On-site', 'Remote', 'Hybrid'];
const DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'Human Resources', 'Finance', 'Operations', 'Design', 'Customer Support'];
const EDUCATION_LEVELS = ['High School', 'Associate', 'Bachelor\'s', 'Master\'s', 'Doctorate', 'Any'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'];
const QUESTION_TYPES = [
  { value: 'short-answer', label: 'Short Answer' },
  { value: 'paragraph', label: 'Paragraph' },
  { value: 'yes-no', label: 'Yes/No' },
  { value: 'multiple-choice', label: 'Multiple Choice' },
];

const STEPS = [
  { id: 1, label: 'Basic Information' },
  { id: 2, label: 'Job Details' },
  { id: 3, label: 'Requirements' },
  { id: 4, label: 'Screening Questions' },
  { id: 5, label: 'Preview' },
  { id: 6, label: 'Publish' },
];

const initialFormData = {
  title: '',
  jobType: 'Internship',
  workplaceType: 'On-site',
  department: '',
  company: '',
  location: '',
  description: '',
  responsibilities: '',
  benefits: '',
  salary: '',
  currency: 'USD',
  openings: 1,
  deadline: '',
  skills: [],
  preferredSkills: [],
  education: '',
  experience: '',
  languages: [],
  certifications: [],
  screeningQuestions: [],
};

const CreateJob = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newPreferredSkill, setNewPreferredSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [newQuestion, setNewQuestion] = useState({ question: '', type: 'short-answer', options: [''] });

  useEffect(() => {
    if (isEdit) {
      fetchJob();
    }
  }, [id]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/recruiter/jobs/${id}`);
      if (res.data.success) {
        const job = res.data.data;
        setFormData({
          title: job.title || '',
          jobType: job.jobType || 'Internship',
          workplaceType: job.workplaceType || 'On-site',
          department: job.department || '',
          company: job.company || '',
          location: job.location || '',
          description: job.description || '',
          responsibilities: job.responsibilities?.join('\n') || '',
          benefits: job.benefits?.join('\n') || '',
          salary: job.salary || '',
          currency: job.currency || 'USD',
          openings: job.openings || 1,
          deadline: job.deadline ? job.deadline.split('T')[0] : '',
          skills: job.skills || [],
          preferredSkills: job.preferredSkills || [],
          education: job.education || '',
          experience: job.experience || '',
          languages: job.languages || [],
          certifications: job.certifications || [],
          screeningQuestions: job.screeningQuestions || [],
        });
      }
    } catch (err) {
      console.error('Failed to fetch job:', err);
      setError('Failed to load job data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addSkill = (skill, type = 'skills') => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    const list = type === 'preferred' ? formData.preferredSkills : formData.skills;
    if (list.includes(trimmed)) {
      setError('This skill already exists');
      return;
    }
    setFormData(prev => ({
      ...prev,
      [type === 'preferred' ? 'preferredSkills' : 'skills']: [...list, trimmed]
    }));
    if (type === 'preferred') setNewPreferredSkill('');
    else setNewSkill('');
    setError('');
  };

  const removeSkill = (index, type = 'skills') => {
    setFormData(prev => ({
      ...prev,
      [type === 'preferred' ? 'preferredSkills' : 'skills']: prev[type === 'preferred' ? 'preferredSkills' : 'skills'].filter((_, i) => i !== index)
    }));
  };

  const addLanguage = () => {
    const trimmed = newLanguage.trim();
    if (!trimmed) return;
    if (formData.languages.includes(trimmed)) {
      setError('This language already exists');
      return;
    }
    setFormData(prev => ({ ...prev, languages: [...prev.languages, trimmed] }));
    setNewLanguage('');
    setError('');
  };

  const removeLanguage = (index) => {
    setFormData(prev => ({ ...prev, languages: prev.languages.filter((_, i) => i !== index) }));
  };

  const addCertification = () => {
    const trimmed = newCertification.trim();
    if (!trimmed) return;
    if (formData.certifications.includes(trimmed)) {
      setError('This certification already exists');
      return;
    }
    setFormData(prev => ({ ...prev, certifications: [...prev.certifications, trimmed] }));
    setNewCertification('');
    setError('');
  };

  const removeCertification = (index) => {
    setFormData(prev => ({ ...prev, certifications: prev.certifications.filter((_, i) => i !== index) }));
  };

  const addQuestion = () => {
    if (!newQuestion.question.trim()) {
      setError('Please enter a question');
      return;
    }
    setFormData(prev => ({
      ...prev,
      screeningQuestions: [...prev.screeningQuestions, { ...newQuestion, order: prev.screeningQuestions.length }]
    }));
    setNewQuestion({ question: '', type: 'short-answer', options: [''] });
    setError('');
  };

  const removeQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      screeningQuestions: prev.screeningQuestions.filter((_, i) => i !== index).map((q, i) => ({ ...q, order: i }))
    }));
  };

  const updateQuestion = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      screeningQuestions: prev.screeningQuestions.map((q, i) => i === index ? { ...q, [field]: value } : q)
    }));
  };

  const addQuestionOption = (questionIndex) => {
    setFormData(prev => ({
      ...prev,
      screeningQuestions: prev.screeningQuestions.map((q, i) => 
        i === questionIndex ? { ...q, options: [...q.options, ''] } : q
      )
    }));
  };

  const updateQuestionOption = (questionIndex, optionIndex, value) => {
    setFormData(prev => ({
      ...prev,
      screeningQuestions: prev.screeningQuestions.map((q, i) => 
        i === questionIndex ? { ...q, options: q.options.map((opt, oi) => oi === optionIndex ? value : opt) } : q
      )
    }));
  };

  const removeQuestionOption = (questionIndex, optionIndex) => {
    setFormData(prev => ({
      ...prev,
      screeningQuestions: prev.screeningQuestions.map((q, i) => 
        i === questionIndex ? { ...q, options: q.options.filter((_, oi) => oi !== optionIndex) } : q
      )
    }));
  };

  const saveDraft = async () => {
    try {
      setSaving(true);
      const payload = {
        ...formData,
        status: 'draft',
        responsibilities: formData.responsibilities.split('\n').filter(Boolean),
        benefits: formData.benefits.split('\n').filter(Boolean),
      };
      
      if (isEdit) {
        await api.put(`/recruiter/jobs/${id}`, payload);
      } else {
        const res = await api.post('/recruiter/jobs', payload);
        navigate(`/recruiter/jobs/${res.data.data._id}/edit`, { replace: true });
      }
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const publishJob = async () => {
    try {
      setSaving(true);
      const payload = {
        ...formData,
        status: 'published',
        responsibilities: formData.responsibilities.split('\n').filter(Boolean),
        benefits: formData.benefits.split('\n').filter(Boolean),
      };

      if (isEdit) {
        await api.put(`/recruiter/jobs/${id}`, payload);
        await api.post(`/recruiter/jobs/${id}/publish`);
      } else {
        const res = await api.post('/recruiter/jobs', payload);
        await api.post(`/recruiter/jobs/${res.data.data._id}/publish`);
      }
      navigate('/recruiter/jobs');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish job');
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 6) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <h2 className={styles.stepTitle}>Basic Information</h2>
              <p className={styles.stepDescription}>Start with the essentials that candidates will see first.</p>
            </div>
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>
                <Briefcase size={18} />
                Position Details
              </h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Job Title <span className={styles.requiredStar}>*</span></label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} className={styles.input} placeholder="e.g. Senior Software Engineer" required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Job Type <span className={styles.requiredStar}>*</span></label>
                  <select name="jobType" value={formData.jobType} onChange={handleChange} className={styles.select}>
                    {EMPLOYMENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Workplace Type <span className={styles.requiredStar}>*</span></label>
                  <select name="workplaceType" value={formData.workplaceType} onChange={handleChange} className={styles.select}>
                    {WORKPLACE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Department</label>
                  <select name="department" value={formData.department} onChange={handleChange} className={styles.select}>
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>
                <MapPin size={18} />
                Location & Company
              </h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Company</label>
                  <input type="text" name="company" value={formData.company} onChange={handleChange} className={styles.input} placeholder="Company name" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Location <span className={styles.requiredStar}>*</span></label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} className={styles.input} placeholder="e.g. San Francisco, CA" required />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <h2 className={styles.stepTitle}>Job Details</h2>
              <p className={styles.stepDescription}>Describe the role, responsibilities, and what you offer.</p>
            </div>
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>
                <ClipboardList size={18} />
                Description
              </h3>
              <div className={styles.formGroup}>
                <label className={styles.label}>Job Description <span className={styles.requiredStar}>*</span></label>
                <textarea name="description" value={formData.description} onChange={handleChange} className={styles.textarea} rows={6} placeholder="Describe the role, impact, and what a typical day looks like..." required />
                <span className={styles.helperText}>Be specific about the role and team culture.</span>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Responsibilities</label>
                <textarea name="responsibilities" value={formData.responsibilities} onChange={handleChange} className={styles.textarea} rows={4} placeholder="• Collaborate with cross-functional teams&#10;• Develop and maintain applications" />
                <span className={styles.helperText}>One responsibility per line for best results.</span>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Benefits</label>
                <textarea name="benefits" value={formData.benefits} onChange={handleChange} className={styles.textarea} rows={3} placeholder="• Health insurance&#10;• Remote work options&#10;• Learning budget" />
                <span className={styles.helperText}>Highlight perks that make this role attractive.</span>
              </div>
            </div>
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>
                <DollarSign size={18} />
                Compensation & Schedule
              </h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Salary Range</label>
                  <input type="text" name="salary" value={formData.salary} onChange={handleChange} className={styles.input} placeholder="e.g. $80,000 - $120,000" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Currency</label>
                  <select name="currency" value={formData.currency} onChange={handleChange} className={styles.select}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Number of Openings</label>
                  <input type="number" name="openings" value={formData.openings} onChange={handleChange} className={styles.input} min="1" />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Application Deadline</label>
                  <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} className={styles.input} />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <h2 className={styles.stepTitle}>Requirements</h2>
              <p className={styles.stepDescription}>Define the skills, education, and qualifications needed.</p>
            </div>
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>
                <Sparkles size={18} />
                Required Skills
              </h3>
              <div className={styles.formGroup}>
                <label className={styles.label}>Skills</label>
                <div className={styles.tagInput}>
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(newSkill))}
                    className={styles.input}
                    placeholder="Add a skill and press Enter"
                  />
                  <button type="button" onClick={() => addSkill(newSkill)} className={styles.addButton}>
                    <Plus size={16} />
                    Add
                  </button>
                </div>
                <div className={styles.tags}>
                  {formData.skills.map((skill, index) => (
                    <span key={index} className={styles.tag}>
                      {skill}
                      <button type="button" onClick={() => removeSkill(index)} className={styles.tagRemove}>×</button>
                    </span>
                  ))}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Preferred Skills</label>
                <div className={styles.tagInput}>
                  <input
                    type="text"
                    value={newPreferredSkill}
                    onChange={(e) => setNewPreferredSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(newPreferredSkill, 'preferred'))}
                    className={styles.input}
                    placeholder="Add a preferred skill and press Enter"
                  />
                  <button type="button" onClick={() => addSkill(newPreferredSkill, 'preferred')} className={styles.addButton}>
                    <Plus size={16} />
                    Add
                  </button>
                </div>
                <div className={styles.tags}>
                  {formData.preferredSkills.map((skill, index) => (
                    <span key={index} className={`${styles.tag} ${styles.tagPreferred}`}>
                      {skill}
                      <button type="button" onClick={() => removeSkill(index, 'preferred')} className={styles.tagRemove}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>
                <GraduationCap size={18} />
                Education & Experience
              </h3>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Education Level</label>
                  <select name="education" value={formData.education} onChange={handleChange} className={styles.select}>
                    <option value="">Select education level</option>
                    {EDUCATION_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Experience Required</label>
                  <input type="text" name="experience" value={formData.experience} onChange={handleChange} className={styles.input} placeholder="e.g. 2+ years" />
                </div>
              </div>
            </div>
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>
                <Languages size={18} />
                Languages & Certifications
              </h3>
              <div className={styles.formGroup}>
                <label className={styles.label}>Languages</label>
                <div className={styles.tagInput}>
                  <input type="text" value={newLanguage} onChange={(e) => setNewLanguage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())} className={styles.input} placeholder="Add a language and press Enter" />
                  <button type="button" onClick={addLanguage} className={styles.addButton}>
                    <Plus size={16} />
                    Add
                  </button>
                </div>
                <div className={styles.tags}>
                  {formData.languages.map((lang, index) => (
                    <span key={index} className={styles.tag}>
                      {lang}
                      <button type="button" onClick={() => removeLanguage(index)} className={styles.tagRemove}>×</button>
                    </span>
                  ))}
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Certifications (Optional)</label>
                <div className={styles.tagInput}>
                  <input type="text" value={newCertification} onChange={(e) => setNewCertification(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())} className={styles.input} placeholder="Add a certification and press Enter" />
                  <button type="button" onClick={addCertification} className={styles.addButton}>
                    <Plus size={16} />
                    Add
                  </button>
                </div>
                <div className={styles.tags}>
                  {formData.certifications.map((cert, index) => (
                    <span key={index} className={styles.tag}>
                      {cert}
                      <button type="button" onClick={() => removeCertification(index)} className={styles.tagRemove}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <h2 className={styles.stepTitle}>Screening Questions</h2>
              <p className={styles.stepDescription}>Add custom questions to help you evaluate candidates.</p>
            </div>
            <div className={styles.questionsList}>
              {formData.screeningQuestions.map((q, index) => (
                <div key={index} className={styles.questionCard}>
                  <div className={styles.questionHeader}>
                    <GripVertical size={18} />
                    <span className={styles.questionNumber}>Question {index + 1}</span>
                    <button type="button" onClick={() => removeQuestion(index)} className={styles.removeButton}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <input type="text" value={q.question} onChange={(e) => updateQuestion(index, 'question', e.target.value)} className={styles.input} placeholder="Enter your question" />
                  <select value={q.type} onChange={(e) => updateQuestion(index, 'type', e.target.value)} className={styles.select}>
                    {QUESTION_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                  {q.type === 'multiple-choice' && (
                    <div className={styles.optionsList}>
                      {q.options.map((opt, oi) => (
                        <div key={oi} className={styles.optionItem}>
                          <input type="text" value={opt} onChange={(e) => updateQuestionOption(index, oi, e.target.value)} className={styles.input} placeholder={`Option ${oi + 1}`} />
                          <button type="button" onClick={() => removeQuestionOption(index, oi)} className={styles.removeButton}>×</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => addQuestionOption(index)} className={styles.addOptionButton}>+ Add Option</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className={styles.addQuestionForm}>
              <h3 className={styles.addQuestionTitle}>Add New Question</h3>
              <input type="text" value={newQuestion.question} onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))} className={styles.input} placeholder="Enter your question" />
              <select value={newQuestion.type} onChange={(e) => setNewQuestion(prev => ({ ...prev, type: e.target.value, options: e.target.value === 'multiple-choice' ? [''] : [] }))} className={styles.select}>
                {QUESTION_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
              {newQuestion.type === 'multiple-choice' && (
                <div className={styles.optionsList}>
                  {newQuestion.options.map((opt, index) => (
                    <div key={index} className={styles.optionItem}>
                      <input type="text" value={opt} onChange={(e) => {
                        const newOptions = [...newQuestion.options];
                        newOptions[index] = e.target.value;
                        setNewQuestion(prev => ({ ...prev, options: newOptions }));
                      }} className={styles.input} placeholder={`Option ${index + 1}`} />
                      <button type="button" onClick={() => setNewQuestion(prev => ({ ...prev, options: prev.options.filter((_, i) => i !== index) }))} className={styles.removeButton}>×</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => setNewQuestion(prev => ({ ...prev, options: [...prev.options, ''] }))} className={styles.addOptionButton}>+ Add Option</button>
                </div>
              )}
              <button type="button" onClick={addQuestion} className={styles.addButton}>
                <Plus size={16} />
                Add Question
              </button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <h2 className={styles.stepTitle}>Preview</h2>
              <p className={styles.stepDescription}>Review how your job posting will appear to candidates.</p>
            </div>
            <div className={styles.previewCard}>
              <div className={styles.previewHeader}>
                <div className={styles.previewHeaderTop}>
                  <h1>{formData.title || 'Untitled Job'}</h1>
                  <div className={styles.previewMeta}>
                    <span className={styles.previewMetaTag}>{formData.jobType}</span>
                    <span className={styles.previewMetaTag}>{formData.workplaceType}</span>
                    {formData.location && <span className={styles.previewMetaTag}><MapPin size={14} /> {formData.location}</span>}
                  </div>
                </div>
                {formData.company && (
                  <div className={styles.previewMeta}>
                    <Users size={16} />
                    {formData.company}
                  </div>
                )}
              </div>
              {formData.description && (
                <div className={styles.previewSection}>
                  <h3>Description</h3>
                  <p>{formData.description}</p>
                </div>
              )}
              {formData.responsibilities && (
                <div className={styles.previewSection}>
                  <h3>Responsibilities</h3>
                  <ul>
                    {formData.responsibilities.split('\n').filter(Boolean).map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}
              {formData.benefits && (
                <div className={styles.previewSection}>
                  <h3>Benefits</h3>
                  <ul>
                    {formData.benefits.split('\n').filter(Boolean).map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              )}
              {formData.skills.length > 0 && (
                <div className={styles.previewSection}>
                  <h3>Required Skills</h3>
                  <div className={styles.previewSkills}>
                    {formData.skills.map((skill, i) => <span key={i} className={styles.tag}>{skill}</span>)}
                  </div>
                </div>
              )}
              {formData.preferredSkills.length > 0 && (
                <div className={styles.previewSection}>
                  <h3>Preferred Skills</h3>
                  <div className={styles.previewSkills}>
                    {formData.preferredSkills.map((skill, i) => <span key={i} className={`${styles.tag} ${styles.tagPreferred}`}>{skill}</span>)}
                  </div>
                </div>
              )}
              {(formData.salary || formData.openings > 1 || formData.deadline) && (
                <div className={styles.previewSection}>
                  <h3>Additional Details</h3>
                  <div className={styles.previewMeta}>
                    {formData.salary && <span className={styles.previewMetaTag}><DollarSign size={14} /> {formData.salary} {formData.currency}</span>}
                    {formData.openings > 1 && <span className={styles.previewMetaTag}><Users size={14} /> {formData.openings} openings</span>}
                    {formData.deadline && <span className={styles.previewMetaTag}><Clock size={14} /> Deadline: {new Date(formData.deadline).toLocaleDateString()}</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <h2 className={styles.stepTitle}>Publish Job</h2>
              <p className={styles.stepDescription}>Choose how you want to share this opportunity with candidates.</p>
            </div>
            <div className={styles.publishOptions}>
              <div className={styles.publishOption}>
                <div className={styles.publishOptionIcon} style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
                  <Send size={28} />
                </div>
                <h3>Publish Immediately</h3>
                <p>Your job will be live and visible to candidates right away.</p>
                <button onClick={publishJob} disabled={saving} className={styles.publishButton}>
                  {saving ? 'Publishing...' : 'Publish Now'}
                  {!saving && <Send size={18} />}
                </button>
              </div>
              <div className={styles.publishOption}>
                <div className={styles.publishOptionIcon} style={{ background: 'rgba(107, 114, 128, 0.15)', color: 'var(--text-secondary)' }}>
                  <Save size={28} />
                </div>
                <h3>Save as Draft</h3>
                <p>Save your progress and publish later when ready.</p>
                <button onClick={saveDraft} disabled={saving} className={styles.draftButton}>
                  {saving ? 'Saving...' : 'Save Draft'}
                  {!saving && <Save size={18} />}
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) return <Loader fullPage />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/recruiter/jobs')}>
          <ChevronLeft size={20} />
          Back to Jobs
        </button>
        <div>
          <h1 className={styles.pageTitle}>{isEdit ? 'Edit Job' : 'Create New Job'}</h1>
          <p className={styles.pageSubtitle}>Fill in the details below to create your job posting</p>
        </div>
      </div>

      <div className={styles.progressBar}>
        {STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className={`${styles.progressStep} ${currentStep >= step.id ? styles.progressStepActive : ''}`}>
              <div className={styles.progressCircle}>{step.id}</div>
              <span className={styles.progressLabel}>{step.label}</span>
            </div>
            {index < STEPS.length - 1 && <div className={`${styles.progressLine} ${currentStep > step.id ? styles.progressLineActive : ''}`} />}
          </React.Fragment>
        ))}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.formCard}>
        {renderStep()}
      </div>

      <div className={styles.navigation}>
        <button onClick={prevStep} disabled={currentStep === 1} className={styles.navButton}>
          <ChevronLeft size={18} />
          Previous
        </button>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {currentStep === 5 && (
            <button onClick={saveDraft} disabled={saving} className={styles.saveDraftInline}>
              <Save size={16} />
              Save Draft
            </button>
          )}
          {currentStep < 6 && (
            <button onClick={nextStep} className={`${styles.navButton} ${styles.navButtonPrimary}`}>
              Next
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateJob;