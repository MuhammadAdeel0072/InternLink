import TalentPool from '../models/TalentPool.js';
import TalentCollection from '../models/TalentCollection.js';
import Profile from '../models/Profile.js';
import { escapeRegExp } from '../utils/regex.js';

export const getTalentPoolMatchQuery = (recruiterId, { archived = 'false', isFavorite = '', rating = '', tags = '', collectionId = '', status = '' } = {}) => {
  let matchQuery = { recruiter: recruiterId };

  if (archived === 'true') {
    matchQuery.archived = true;
  } else {
    matchQuery.archived = false;
  }

  if (isFavorite === 'true') {
    matchQuery.isFavorite = true;
  }

  if (rating) {
    const minRating = parseInt(rating);
    if (!isNaN(minRating)) {
      matchQuery.rating = { $gte: minRating };
    }
  }

  if (tags) {
    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (tagArray.length > 0) {
      matchQuery.tags = { $in: tagArray };
    }
  }

  if (collectionId) {
    matchQuery.collections = collectionId;
  }

  if (status) {
    matchQuery.status = status;
  }

  return matchQuery;
};

export const buildSearchPipeline = (pipeline, { search = '', skills = '', location = '', education = '', experience = '', availability = '' } = {}) => {
  const sanitizedSearch = search ? escapeRegExp(search) : null;
  const sanitizedLocation = location ? escapeRegExp(location) : null;
  const sanitizedSkills = skills ? escapeRegExp(skills) : null;
  const sanitizedEducation = education ? escapeRegExp(education) : null;

  if (sanitizedSearch) {
    pipeline.push({
      $match: {
        $or: [
          { 'candidateData.name': { $regex: sanitizedSearch, $options: 'i' } },
          { 'candidateData.email': { $regex: sanitizedSearch, $options: 'i' } },
          { 'profileData.headline': { $regex: sanitizedSearch, $options: 'i' } },
          { 'profileData.university': { $regex: sanitizedSearch, $options: 'i' } },
          { 'profileData.skills.name': { $regex: sanitizedSearch, $options: 'i' } },
          { 'profileData.currentStatus': { $regex: sanitizedSearch, $options: 'i' } }
        ]
      }
    });
  }

  if (sanitizedLocation) {
    pipeline.push({
      $match: {
        $or: [
          { 'profileData.locationString': { $regex: sanitizedLocation, $options: 'i' } },
          { 'profileData.location.country': { $regex: sanitizedLocation, $options: 'i' } },
          { 'profileData.location.city': { $regex: sanitizedLocation, $options: 'i' } }
        ]
      }
    });
  }

  if (sanitizedSkills) {
    pipeline.push({
      $match: {
        'profileData.skills.name': { $regex: sanitizedSkills, $options: 'i' }
      }
    });
  }

  if (sanitizedEducation) {
    pipeline.push({
      $match: {
        'profileData.education.degree': { $regex: sanitizedEducation, $options: 'i' }
      }
    });
  }

  if (availability) {
    pipeline.push({
      $match: {
        'profileData.currentStatus': availability
      }
    });
  }

  if (experience) {
    const minYears = parseInt(experience);
    if (!isNaN(minYears)) {
      pipeline.push({
        $match: {
          'profileData.yearsOfExperience': { $gte: minYears }
        }
      });
    }
  }

  return pipeline;
};

export const getSortOption = (sort = 'newest') => {
  switch (sort) {
    case 'oldest':
      return { createdAt: 1 };
    case 'rating':
      return { rating: -1 };
    case 'name':
      return { 'candidateData.name': 1 };
    case 'recently-updated':
      return { updatedAt: -1 };
    default:
      return { createdAt: -1 };
  }
};
