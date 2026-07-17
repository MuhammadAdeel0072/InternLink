import Connection from '../models/Connection.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import Notification from '../models/Notification.js';

// @desc    Send a connection request
// @route   POST /api/connections/request/:userId
// @access  Private
export const sendConnectionRequest = async (req, res) => {
  try {
    const recipientId = req.params.userId;
    const requesterId = req.user._id;

    if (recipientId === requesterId.toString()) {
      return res.status(400).json({ message: 'You cannot connect with yourself' });
    }

    const existingConnection = await Connection.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });

    if (existingConnection) {
      return res.status(400).json({ message: 'Connection or request already exists' });
    }

    const connection = await Connection.create({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending'
    });

    // Create Notification
    await Notification.create({
      recipient: recipientId,
      sender: requesterId,
      type: 'connection-request',
      content: `${req.user.name} sent you a connection request.`,
      link: '/network'
    });

    res.status(201).json(connection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept a connection request
// @route   PUT /api/connections/accept/:connectionId
// @access  Private
export const acceptConnectionRequest = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.connectionId);

    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    if (connection.recipient.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to accept this request' });
    }

    connection.status = 'accepted';
    await connection.save();

    // Create Notification for the requester
    await Notification.create({
      recipient: connection.requester,
      sender: req.user._id,
      type: 'connection-accept',
      content: `${req.user.name} accepted your connection request.`,
      link: `/profile/${req.user._id}`
    });

    res.status(200).json(connection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject/Ignore a connection request
// @route   DELETE /api/connections/reject/:connectionId
// @access  Private
export const rejectConnectionRequest = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.connectionId);

    if (!connection) {
      return res.status(404).json({ message: 'Connection request not found' });
    }

    if (
      connection.recipient.toString() !== req.user._id.toString() &&
      connection.requester.toString() !== req.user._id.toString()
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await Connection.findByIdAndDelete(req.params.connectionId);
    res.status(200).json({ message: 'Connection request removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pending received connection requests
// @route   GET /api/connections/pending
// @access  Private
export const getPendingRequests = async (req, res) => {
  try {
    const requests = await Connection.find({
      recipient: req.user._id,
      status: 'pending'
    }).populate('requester', 'name email');

    // Populate profile details (avatars) for requester
    const populatedRequests = await Promise.all(
      requests.map(async (reqst) => {
        const profile = await Profile.findOne({ user: reqst.requester._id }).select('avatar headline');
        return {
          _id: reqst._id,
          requester: {
            _id: reqst.requester._id,
            name: reqst.requester.name,
            email: reqst.requester.email,
            avatar: profile?.avatar || '',
            headline: profile?.headline || ''
          },
          status: reqst.status,
          createdAt: reqst.createdAt
        };
      })
    );

    res.status(200).json(populatedRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user's connections
// @route   GET /api/connections
// @access  Private
export const getConnectionsList = async (req, res) => {
  try {
    const connections = await Connection.find({
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
      status: 'accepted'
    }).populate('requester recipient', 'name email');

    const list = await Promise.all(
      connections.map(async (conn) => {
        const otherUser =
          conn.requester._id.toString() === req.user._id.toString()
            ? conn.recipient
            : conn.requester;

        const profile = await Profile.findOne({ user: otherUser._id }).select('avatar headline location');
        return {
          connectionId: conn._id,
          _id: otherUser._id,
          name: otherUser.name,
          email: otherUser.email,
          avatar: profile?.avatar || '',
          headline: profile?.headline || '',
          location: profile?.location || ''
        };
      })
    );

    res.status(200).json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get connection suggestions (users not connected yet)
// @route   GET /api/connections/suggestions
// @access  Private
export const getConnectionSuggestions = async (req, res) => {
  try {
    const myConnections = await Connection.find({
      $or: [{ requester: req.user._id }, { recipient: req.user._id }]
    });

    const connectedUserIds = myConnections.map((conn) =>
      conn.requester.toString() === req.user._id.toString()
        ? conn.recipient.toString()
        : conn.requester.toString()
    );

    // Exclude myself and already connected/pending users
    connectedUserIds.push(req.user._id.toString());

    const suggestions = await User.find({
      _id: { $nin: connectedUserIds }
    })
      .select('name email role')
      .limit(10);

    const formattedSuggestions = await Promise.all(
      suggestions.map(async (usr) => {
        const profile = await Profile.findOne({ user: usr._id }).select('avatar headline');
        return {
          _id: usr._id,
          name: usr.name,
          email: usr.email,
          role: usr.role,
          avatar: profile?.avatar || '',
          headline: profile?.headline || ''
        };
      })
    );

    res.status(200).json(formattedSuggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
