"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const axios_1 = __importDefault(require("axios"));
const lodash_1 = __importDefault(require("lodash"));
const port = process.env.PORT || 3000;
const app = (0, express_1.default)();
// Middleware for JSON parsing and CORS handling
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// data fetching function
const fetchBlogData = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fetch blog data from the API
        const apiUrl = 'https://intent-kit-16.hasura.app/api/rest/blogs';
        const adminSecret = '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6';
        const response = yield axios_1.default.get(apiUrl, {
            headers: {
                'x-hasura-admin-secret': adminSecret
            }
        });
        console.log('data');
        return response.data;
    }
    catch (error) {
        console.error('Error fetching blog data:', error);
        throw new Error('Internal Server Error');
    }
});
// Middleware to fetch blog data
const getData = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const memorizedData = lodash_1.default.memoize(fetchBlogData, () => 'BlogsData');
        const getBlogsData = yield memorizedData();
        // console.log(getBlogsData);
        req.blogData = getBlogsData;
        next();
    }
    catch (error) {
        console.error('Error fetching blog data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
//Analytics functions
const analyticFunction = (blogData) => {
    const totalBlogsNumber = blogData.length;
    const longerTitlesBlogs = lodash_1.default.maxBy(blogData, 'title.length') || { id: "", title: "", image_url: "" };
    const titleWithPrivacyNumber = lodash_1.default.filter(blogData, blog => lodash_1.default.includes(lodash_1.default.toLower(blog.title), "privacy")).length;
    const uniqueTitleBlogs = lodash_1.default.uniqBy(blogData, 'title').map(blog => blog.title);
    // console.log(totalBlogsNumber, longerTitlesBlogs, titleWithPrivacyNumber, uniqueTitleBlogs);
    const analytics = {
        totalBlogsNumber,
        longerTitlesBlogs,
        titleWithPrivacyNumber,
        uniqueTitleBlogs
    };
    return analytics;
};
// Middleware to perform analytics
const dataAnalytics = (req, res, next) => {
    var _a;
    const blogData = (_a = req.blogData) === null || _a === void 0 ? void 0 : _a.blogs;
    if (blogData) {
        const memorizedAnalytics = lodash_1.default.memoize(analyticFunction, () => "analytics");
        const analytics = memorizedAnalytics(blogData);
        req.analytics = analytics;
        next();
    }
    else {
        return next("");
    }
};
// Route to fetch blog stats and perform analytics
app.get('/api/blog-stats', getData, dataAnalytics, (req, res, next) => {
    const analytics = req.analytics;
    if (analytics) {
        return res.status(200).json(analytics);
    }
    else {
        return next("server side problem");
    }
});
// Routes for Searching 
app.get('/api/blog-search', getData, (req, res) => {
    var _a, _b;
    const blogData = (_a = req.blogData) === null || _a === void 0 ? void 0 : _a.blogs;
    const searchQuery = (_b = req.query.query) === null || _b === void 0 ? void 0 : _b.toString().toLowerCase();
    if (blogData && searchQuery) {
        const filterBlog = lodash_1.default.filter(blogData, (blog) => {
            return blog.title.toLowerCase().includes(searchQuery);
        });
        return res.status(200).json(filterBlog);
    }
    else {
        return res.status(400).json({ error: "There is a query problem" });
    }
});
//default error handler
app.use(((err, req, res, next) => {
    if (err.message) {
        return res.status(500).json({ error: err.message });
    }
    else {
        return res.status(500).json({ error: "There was a server side error" });
    }
}));
// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
