const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const { check, validationResult } = require('express-validator')
const request = require('request')
const config = require('config')
const normalize = require('normalize-url')

const Profile = require('../../models/Profile')
const User = require('../../models/User')
const Post = require('../../models/Post')
const { response } = require('express')

// @route   GET api/profile/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({
			user: req.user.id,
		}).populate('user', ['name', 'avatar'])
		if (!profile) {
			return res
				.status(400)
				.json({ msg: 'There is no profile for this user' })
		}
		res.json(profile)
	} catch (err) {
		console.error(err.message)
		res.status(500).send('Server Error')
	}
})

// @route   POST api/profile
// @desc    Create / update user profile
// @access  Private
router.post(
	'/',
	[
		auth,
		[
			check('status', 'Status is required').not().isEmpty(),
			check('skills', 'Skills are required').not().isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req)
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() })
		}

		const {
			website,
			skills,
			youtube,
			facebook,
			twitter,
			instagram,
			linkedin,
			...rest
		} = req.body

		// Build profile object
		const profileFields = {
			user: req.user.id,
			website:
				website && website !== ''
					? normalize(website, { forceHttps: true })
					: '',
			skills: Array.isArray(skills)
				? skills
				: skills.split(',').map((skill) => skill.trim()),
			...rest,
		}
		// profileFields.user = req.user.id;
		// if (company) profileFields.company = company;
		// if (website) profileFields.website = website;
		// if (location) profileFields.location = location;
		// if (bio) profileFields.bio = bio;
		// if (status) profileFields.status = status;
		// if (githubusername) profileFields.githubusername = githubusername;
		// if (skills) {
		// 	profileFields.skills = skills.split(',').map((skill) => skill.trim());
		// }
		// console.log(profileFields.skills);

		// Build Social object
		const socialFields = { youtube, facebook, twitter, instagram, linkedin }
		// profileFields.social = {youtube, facebook, twitter, instagram, linkedin};
		// if (youtube) profileFields.social.youtube = youtube;
		// if (facebook) profileFields.social.facebook = facebook;
		// if (twitter) profileFields.social.twitter = twitter;
		// if (instagram) profileFields.social.instagram = instagram;
		// if (linkedin) profileFields.social.linkedin = linkedin;

		for (const [key, value] of Object.entries(socialFields)) {
			if (value && value.length > 0) {
				socialFields[key] = normalize(value, { forceHttps: true })
			}
		}
		profileFields.social = socialFields

		try {
			let profile = await Profile.findOne({ user: req.user.id })
			if (profile) {
				//Update
				profile = await Profile.findOneAndUpdate(
					{ user: req.user.id },
					{ $set: profileFields },
					{ new: true }
				)
				return res.json(profile)
			}

			//Create
			profile = new Profile(profileFields)
			await profile.save()
			res.json(profile)
		} catch (err) {
			console.error(err.message)
			res.status(500).send('Server Error')
		}
	}
)

// @route   GET api/profile
// @desc    Get all profiles
// @access  Public
router.get('/', async (req, res) => {
	try {
		const profiles = await Profile.find().populate('user', ['name', 'avatar'])
		res.json(profiles)
	} catch (err) {
		console.error(err.message)
		res.status(500).send('Server Error')
	}
})

// @route   GET api/profile/user/:user_id
// @desc    Get profile by user ID
// @access  Public
router.get('/user/:user_id', async (req, res) => {
	try {
		const profile = await Profile.findOne({
			user: req.params.user_id,
		}).populate('user', ['name', 'avatar'])
		if (!profile) {
			return res.status(400).json({ msg: 'Profile not found' })
		}
		res.json(profile)
	} catch (err) {
		console.error(err.message)
		if (err.kind == 'ObjectId') {
			return res.status(400).json({ msg: 'Profile not found' })
		}
		res.status(500).send('Server Error')
	}
})

// @route   DELETE api/profile
// @desc    Delete profile, user, & posts
// @access  Private
router.delete('/', auth, async (req, res) => {
	try {
		//Remove user posts
		await Post.deleteMany({ user: req.user.id })
		//Remove profile
		await Profile.findOneAndRemove({ user: req.user.id })
		//Remove user
		await User.findOneAndRemove({ _id: req.user.id })
		res.json({ msg: 'User deleted' })
	} catch (err) {
		console.error(err.message)
		res.status(500).send('Server Error')
	}
})

// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  Private
router.put(
	'/experience',
	[
		auth,
		[
			check('title', 'Title is required').not().isEmpty(),
			check('company', 'Company is required').not().isEmpty(),
			check('from', 'From Date is required').not().isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req)
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() })
		}

		const {
			title,
			company,
			location,
			from,
			to,
			current,
			description,
		} = req.body

		const newExp = {
			title,
			company,
			location,
			from,
			to,
			current,
			description,
		}

		try {
			const profile = await Profile.findOne({ user: req.user.id })

			profile.experience.unshift(newExp)
			await profile.save()
			res.json(profile)
		} catch (err) {
			console.error(err.message)
			res.status(500).send('Server Error')
		}
	}
)

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete profile experience
// @access  Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id })
		// get remove index
		const removeIndex = profile.experience
			.map((item) => item.id)
			.indexOf(req.params.exp_id)

		profile.experience.splice(removeIndex, 1)
		await profile.save()
		res.json(profile)
	} catch (err) {
		console.error(err.message)
		res.status(500).send('Server Error')
	}
})

// @route   PUT api/profile/education
// @desc    Add profile education
// @access  Private
router.put(
	'/education',
	[
		auth,
		[
			check('school', 'School is required').not().isEmpty(),
			check('degree', 'Degree is required').not().isEmpty(),
			check('fieldOfStudy', 'Field of Study is required').not().isEmpty(),
			check('from', 'From Date is required').not().isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req)
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() })
		}

		const {
			school,
			degree,
			fieldOfStudy,
			from,
			to,
			current,
			description,
		} = req.body

		const newEdu = {
			school,
			degree,
			fieldOfStudy,
			from,
			to,
			current,
			description,
		}

		try {
			const profile = await Profile.findOne({ user: req.user.id })

			profile.education.unshift(newEdu)
			await profile.save()
			res.json(profile)
		} catch (err) {
			console.error(err.message)
			res.status(500).send('Server Error')
		}
	}
)

// @route   DELETE api/profile/education/:edu_id
// @desc    Delete profile education
// @access  Private
router.delete('/education/:edu_id', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id })
		// get remove index
		const removeIndex = profile.education
			.map((item) => item.id)
			.indexOf(req.params.edu_id)

		profile.education.splice(removeIndex, 1)
		await profile.save()
		res.json(profile)
	} catch (err) {
		console.error(err.message)
		res.status(500).send('Server Error')
	}
})

// @route   GET api/profile/github/:username
// @desc    Get user repos from github
// @access  Public
router.get('/github/:username', (req, res) => {
	try {
		const options = {
			uri: `https://api.github.com/users/${
				req.params.username
			}/repos?per_page=5&sort=created:asc&client_id=${config.get(
				'githubClientID'
			)}&client_secret=${config.get('githubSecret')}`,
			method: 'GET',
			headers: { 'user-agent': 'node.js' },
		}
		request(options, (error, response, body) => {
			if (error) console.error(error)
			if (response.statusCode !== 200) {
				return res.status(400).json({ msg: 'No Github profile found' })
			}
			res.json(JSON.parse(body))
		})
	} catch (err) {
		console.error(err.message)
		res.status(500).send('Server Error')
	}
})

module.exports = router
