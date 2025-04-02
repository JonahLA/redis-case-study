import { Router } from 'express';
import productRoutes from './productRoutes';
// import categoryRoutes from './categoryRoutes';
// import brandRoutes from './brandRoutes';

const router = Router();

router.use('/products', productRoutes);
// router.use('/categories', categoryRoutes);
// router.use('/brands', brandRoutes);

export default router;
