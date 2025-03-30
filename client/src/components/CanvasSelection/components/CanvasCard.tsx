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
