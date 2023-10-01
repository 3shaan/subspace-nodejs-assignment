import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import axios from 'axios';
import lodash from 'lodash';

const port = process.env.PORT || 3000;
const app: express.Application = express();

interface CustomRequest extends Request {
    blogData?: BlogData; 
    analytics ?:Analytics
}

interface Analytics {
    totalBlogsNumber : number,
    longerTitlesBlogs : Blog,
    titleWithPrivacyNumber : number,
    uniqueTitleBlogs : string[]
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



// data fetching function

const fetchBlogData = async ():Promise<BlogData> =>{
    try {
        // Fetch blog data from the API
        const apiUrl = 'https://intent-kit-16.hasura.app/api/rest/blogs';
        const adminSecret = '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6';
        const response = await axios.get<BlogData>(apiUrl, {
            headers: {
                'x-hasura-admin-secret': adminSecret
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching blog data:', error);
        throw new Error('Internal Server Error');
    }
}

// Middleware to fetch blog data
const getData = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const memorizedData = lodash.memoize(fetchBlogData, () => 'BlogsData')
        

        const getBlogsData :BlogData = await memorizedData()
        // console.log(getBlogsData);
        req.blogData = getBlogsData;
        next();
    } catch (error) {
        console.error('Error fetching blog data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



//Analytics functions

const analyticFunction =(blogData:Blog[])=>{
    const totalBlogsNumber :number = blogData.length;
    const longerTitlesBlogs : Blog=  lodash.maxBy(blogData, 'title.length') || {id:"", title:"", image_url:""};
    const titleWithPrivacyNumber : number= lodash.filter(blogData, blog=>lodash.includes(lodash.toLower(blog.title), "privacy")).length;
    const uniqueTitleBlogs :string[] = lodash.uniqBy(blogData, 'title').map(blog=>blog.title);
    // console.log(totalBlogsNumber, longerTitlesBlogs, titleWithPrivacyNumber, uniqueTitleBlogs);
    const analytics = {
        totalBlogsNumber,
        longerTitlesBlogs,
        titleWithPrivacyNumber,
        uniqueTitleBlogs
    }

    return analytics;
}




// Middleware to perform analytics
const dataAnalytics = (req: CustomRequest, res: Response, next: NextFunction) => {
    const blogData = req.blogData?.blogs;
    
    if(blogData){
        const memorizedAnalytics = lodash.memoize(analyticFunction,()=>"analytics")
        const analytics = memorizedAnalytics(blogData)
        req.analytics = analytics;
        next();
    }
    else{
        return next("")
    }
    
   
};

// Route to fetch blog stats and perform analytics
app.get('/api/blog-stats', getData,dataAnalytics, (req: CustomRequest, res: Response,next:NextFunction) => {
    const analytics = req.analytics;
    if(analytics){
       return res.status(200).json(analytics);
    }
    else{
        return next("server side problem")
    }
});


// Routes for Searching 
app.get('/api/blog-search', getData, (req:CustomRequest, res:Response)=>{
    const blogData = req.blogData?.blogs;
    const searchQuery =  req.query.query?.toString().toLowerCase();
    if(blogData && searchQuery){
        const memorizedSearch = lodash.memoize((blogData, searchQuery) => {
            const filterBlog = lodash.filter(blogData, (blog) => {
                return blog.title.toLowerCase().includes(searchQuery.toLowerCase());
            });
            return filterBlog;
        });
        // console.log(memorizedSearch(blogData, searchQuery));

       return res.status(200).json(memorizedSearch(blogData, searchQuery));
    }
    else{
        return res.status(400).json({error:"There is a query problem"})
    }
})




//default error handler

app.use(((err:Error,req:Request,res:Response,next:NextFunction)=>{
    if(err.message){
        return res.status(500).json({error:err.message})
    }
    else{
        return res.status(500).json({error:"There was a server side error"})
    }
}) as ErrorRequestHandler);

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
