import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { X } from "lucide-react";
import { Canvas } from "../../../types";

interface CanvasCardProps {
  canvas: Canvas;
  onOpen: (id: string) => void;
  onDelete: (id: string, event: React.MouseEvent<HTMLButtonElement>) => void;
  isSubmitting: boolean;
}

const CanvasCard: React.FC<CanvasCardProps> = ({
  canvas,
  onOpen,
  onDelete,
  isSubmitting,
}) => {
  return (
    <Card key={canvas.id} className="shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{canvas.name}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-700 hover:bg-red-100 h-8 w-8"
            onClick={(e) => onDelete(canvas.id, e)}
            disabled={isSubmitting}
            aria-label="Delete Canvas"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Created: {new Date(canvas.createdAt).toLocaleDateString()}
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onOpen(canvas.id)} className="w-full">
          Open Canvas
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CanvasCard;

// import React from "react";
// import { Box, Heading, Text, Button, Flex, IconButton } from "@chakra-ui/react";
// import { LuX as CloseIcon } from "react-icons/lu";
// import { Canvas } from "../../../types";

// interface CanvasCardProps {
//   canvas: Canvas;
//   onOpen: (id: string) => void;
//   onDelete: (id: string, event: React.MouseEvent<HTMLButtonElement>) => void;
//   isSubmitting: boolean;
// }

// const CanvasCard: React.FC<CanvasCardProps> = ({
//   canvas,
//   onOpen,
//   onDelete,
//   isSubmitting,
// }) => {
//   return (
//     <Box
//       key={canvas.id}
//       borderWidth="1px"
//       borderRadius="lg"
//       overflow="hidden"
//       boxShadow="sm"
//       p={5}
//     >
//       <Flex justifyContent="space-between" alignItems="center" mb={2}>
//         <Heading size="md">{canvas.name}</Heading>
//         <IconButton
//           aria-label="Delete Canvas"
//           size="sm"
//           variant="ghost"
//           colorScheme="red"
//           onClick={(e) => onDelete(canvas.id, e)}
//           disabled={isSubmitting}
//         >
//           <CloseIcon />
//         </IconButton>
//       </Flex>
//       <Text mb={4}>
//         Created: {new Date(canvas.createdAt).toLocaleDateString()}
//       </Text>
//       <Button onClick={() => onOpen(canvas.id)} colorScheme="blue" width="100%">
//         Open Canvas
//       </Button>
//     </Box>
//   );
// };

// export default CanvasCard;
