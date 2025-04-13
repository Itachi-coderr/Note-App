import { motion } from 'framer-motion';

export default function FeatureCard({ title, description, icon }) {
  return (
    <motion.div
      className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition"
      whileHover={{ scale: 1.05 }}
    >
      <div className="text-blue-600 text-3xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-gray-600 mt-2">{description}</p>
    </motion.div>
  );
}
