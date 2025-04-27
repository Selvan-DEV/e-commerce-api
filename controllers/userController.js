const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Order = require('../models/orderModel');

exports.registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, password, role } = req.body;

    // Encrypt the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.createUser({
      firstName,
      lastName,
      email,
      phoneNumber,
      isPrimaryUser: false,
      isActive: true,
      password: hashedPassword,
      role
    });

    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { email, phoneNumber, password, sessionId } = req.body;
    const user = await User.findAdminUser(email, phoneNumber);

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.userId, email: user.email, isPrimeUser: user.isPrimeUser },
      process.env.JWT_SECRET, // Ensure you have a JWT_SECRET environment variable
      // { expiresIn: '1h' }
    );

    if (token && sessionId) {
      const isUpdated = await Order.updateCartUserId(user.userId, sessionId);
    }

    res.status(200).json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, phoneNumber, isPrimaryUser, isActive } = req.body;

    const updatedUser = await User.updateUser(userId, { firstName, lastName, email, phoneNumber, isPrimaryUser, isActive });

    if (updatedUser) {
      res.status(200).json({ message: 'User updated successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const deletedUser = await User.deleteUser(userId);

    if (deletedUser) {
      res.status(200).json({ message: 'User deactivated successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserAddresses = async (req, res) => {
  try {
    const { userId } = req.params;
    const addresses = await User.getUserAddresses(userId);

    res.status(200).json(addresses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getActiveAddressByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: "User ID is Required" })
    }
    const addresses = await User.getActiveAddressByUserId(userId);

    if (addresses.length > 0) {
      return res.status(200).json(addresses[0]);
    } else {
      return res.status(204).json({ message: "No active address found for the logged in user" });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addUserAddress = async (req, res) => {
  try {
    const { userId } = req.params;
    const address = req.body;

    const newAddress = await User.addUserAddress(userId, address);

    res.status(201).json(newAddress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUserAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const address = req.body;

    const updatedAddress = await User.updateUserAddress(addressId, address);

    if (updatedAddress) {
      res.status(200).json({ message: 'Address updated successfully' });
    } else {
      res.status(404).json({ message: 'Address not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteUserAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const deletedAddress = await User.deleteUserAddress(addressId);

    if (deletedAddress) {
      res.status(200).json({ message: 'Address deleted successfully' });
    } else {
      res.status(404).json({ message: 'Address not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  if (!email || !oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Email, old password, and new password are required' });
  }

  try {
    // Find the user by email
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the old password is correct
    // const isMatch = await bcrypt.compare(oldPassword, user.password);
    // if (!isMatch) {
    //   return res.status(400).json({ message: 'Old password is incorrect' });
    // }

    // Encrypt the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the user's password
    const updatedUser = await User.updatePassword(user.userId, hashedPassword);

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.validateCoupon = async (req, res) => {
  const { code, userId } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Coupon code is required.' });
  }

  try {
    const coupon = await User.getCoupon(code);
    if (!coupon) {
      return res.status(404).json({ error: 'Invalid or expired coupon code.' });
    }

    // Check if coupon is user-specific
    // if (coupon.userId && coupon.userId !== userId) {
    //   return res.status(403).json({ error: 'Coupon not valid for this user.' });
    // }

    // Check if usage limit reached
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return res.status(410).json({ error: 'Coupon usage limit reached.' });
    }


    return res.status(200).json({
      message: 'Coupon is valid.',
      discount: {
        type: coupon.type,
        value: coupon.value
      }
    });
  } catch (error) {
    console.error('Error validating coupon:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};