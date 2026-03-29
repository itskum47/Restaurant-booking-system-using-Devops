import { motion } from 'framer-motion';
import RestaurantCard from './RestaurantCard';

function RestaurantGrid({ restaurants = [], variant = 'grid' }) {
  return (
    <div
      className={`${
        variant === 'featured'
          ? 'hide-scrollbar snap-x-mandatory flex gap-5 overflow-x-auto pb-2'
          : 'grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3'
      }`}
    >
      {restaurants.map((restaurant, index) => (
        <motion.div
          key={restaurant.id}
          className={variant === 'featured' ? 'snap-start' : ''}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.35 }}
        >
          <RestaurantCard {...restaurant} variant={variant === 'featured' ? 'featured' : 'grid'} />
        </motion.div>
      ))}
    </div>
  );
}

export default RestaurantGrid;
