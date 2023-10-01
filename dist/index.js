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
// Middleware to fetch blog data
const getData = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const apiUrl = 'https://intent-kit-16.hasura.app/api/rest/blogs';
        const adminSecret = '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6';
        const response = yield axios_1.default.get(apiUrl, {
            headers: {
                'x-hasura-admin-secret': adminSecret
            }
        });
        req.blogData = response.data;
        next();
    }
    catch (error) {
        console.error('Error fetching blog data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Middleware to perform analytics
const dataAnalytics = (req, res, next) => {
    var _a;
    const blogData = (_a = req.blogData) !== null && _a !== void 0 ? _a : { blogs: [] };
    const totalBlogs = blogData === null || blogData === void 0 ? void 0 : blogData.blogs.length;
    if (blogData) {
        const longerTitles = lodash_1.default.maxBy(blogData, 'title.length');
    }
    console.log(totalBlogs);
};
// Route to fetch blog stats and perform analytics
app.get('/api/blog-stats', getData, dataAnalytics, (req, res) => {
    // const blogData = req.blogData;
    res.status(200).json('blogData');
});
// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
