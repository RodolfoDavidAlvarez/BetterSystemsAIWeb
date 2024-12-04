import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { fadeIn, staggerChildren } from "@/lib/animations"

interface RepairItem {
  id: string;
  title: string;
  technician: string;
  vehicle: string;
  category: string;
  imageUrl: string;
}

interface RepairGalleryProps {
  repairs: RepairItem[];
}

export function RepairGallery({ repairs }: RepairGalleryProps) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Alignment Issues': 'bg-orange-500',
      'Transmission Issues': 'bg-yellow-500',
      'Body Damage': 'bg-blue-500',
      'Electrical Issues': 'bg-red-500',
      'Oil Change': 'bg-green-500',
      'Window/Lock Problems': 'bg-purple-500',
      'Structural Repairs': 'bg-teal-500',
      'Battery Issues': 'bg-pink-500',
      'Routine Maintenance': 'bg-emerald-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  return (
    <motion.div
      variants={staggerChildren}
      initial="initial"
      animate="animate"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {repairs.map((repair) => (
        <motion.div key={repair.id} variants={fadeIn}>
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-[4/3] relative">
              <img
                src={repair.imageUrl}
                alt={`Repair ${repair.id}`}
                className="object-cover w-full h-full"
              />
            </div>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs text-white ${getCategoryColor(repair.category)}`}>
                  {repair.category}
                </span>
              </div>
              <h3 className="font-semibold mb-1">{repair.title}</h3>
              <p className="text-sm text-muted-foreground">
                {repair.technician}, {repair.vehicle}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
