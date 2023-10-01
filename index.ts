import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios from 'axios';
import lodash from 'lodash';

const port = process.env.PORT || 3000;
const app: express.Application = express();

interface CustomRequest extends Request {
    blogData?: BlogData; 
    analytics ?:any
}

interface Blog {
    id :string
    title: string;
    image_url :string
}

interface BlogData {
    blogs: Blog[];
}

// Middleware for JSON parsing and CORS handling
app.use(express.json());
app.use(cors());

// Middleware to fetch blog data
const getData = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const apiUrl = 'https://intent-kit-16.hasura.app/api/rest/blogs';
        const adminSecret = '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6';

        const response = await axios.get<BlogData>(apiUrl, {
            headers: {
                'x-hasura-admin-secret': adminSecret
            }
        });

        req.blogData = response.data;
        next();
    } catch (error) {
        console.error('Error fetching blog data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Middleware to perform analytics
const dataAnalytics = (req: CustomRequest, res: Response, next: NextFunction) => {
    const blogData = req.blogData?.blogs;
    
    if(blogData){
        const totalBlogsNumber = blogData.length;
        const longerTitlesBlogs =  lodash.maxBy(blogData, 'title.length');
        const titleWithPrivacyNumber = lodash.filter(blogData, blog=>lodash.includes(lodash.toLower(blog.title), "privacy")).length;
        const uniqueTitleBlogs = lodash.uniqBy(blogData, 'title').map(blog=>blog.title);
        console.log(totalBlogsNumber, longerTitlesBlogs, titleWithPrivacyNumber, uniqueTitleBlogs);
        const analytics = {
            totalBlogsNumber,
            longerTitlesBlogs,
            titleWithPrivacyNumber,
            uniqueTitleBlogs
        }
        req.analytics = analytics;
    }
    
   
};

// Route to fetch blog stats and perform analytics
app.get('/api/blog-stats', getData,dataAnalytics, (req: CustomRequest, res: Response) => {
    // const blogData = req.blogData;
    res.status(200).json('blogData');
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
