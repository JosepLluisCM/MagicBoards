// import { useRef } from "react";
// import {
//   Box,
//   Button,
//   Container,
//   Flex,
//   Grid,
//   Heading,
//   Input,
//   Text,
//   VStack,
//   Spinner,
//   useDisclosure,
//   Dialog,
//   Portal,
// } from "@chakra-ui/react";

// import { useCanvasSelection } from "./hooks/useCanvasSelection";
// import CanvasCard from "./components/CanvasCard";

// const CanvasSelection = () => {
//   const { open, onOpen, onClose } = useDisclosure();
//   const cancelRef = useRef<HTMLButtonElement>(null);

//   const {
//     canvases,
//     newCanvasName,
//     setNewCanvasName,
//     canvasToDelete,
//     isLoading,
//     error,
//     isSubmitting,
//     handleCreateCanvas,
//     handleDeleteCanvas,
//     confirmDelete,
//     handleOpenCanvas,
//     handleCancelDelete,
//   } = useCanvasSelection();

//   return (
//     <Container maxW="container.xl" py={8}>
//       <VStack gap={8} width="100%">
//         <Heading textAlign="center" size="xl">
//           My Canvases
//         </Heading>

//         {error && (
//           <Text color="red.500" textAlign="center">
//             {error}
//           </Text>
//         )}

//         <Flex justifyContent="center" width="100%" mb={8}>
//           <Input
//             value={newCanvasName}
//             onChange={(e) => setNewCanvasName(e.target.value)}
//             placeholder="Enter canvas name"
//             size="md"
//             maxW="300px"
//             mr={4}
//             disabled={isSubmitting}
//           />
//           <Button
//             onClick={handleCreateCanvas}
//             colorScheme="blue"
//             loading={isSubmitting}
//             loadingText="Creating"
//           >
//             Create New Canvas
//           </Button>
//         </Flex>

//         {isLoading ? (
//           <Flex justify="center" width="100%" py={10}>
//             <Spinner size="xl" />
//           </Flex>
//         ) : (
//           <Grid
//             templateColumns="repeat(auto-fill, minmax(300px, 1fr))"
//             gap={6}
//             width="100%"
//           >
//             {canvases.length === 0 ? (
//               <Box textAlign="center" gridColumn="1/-1">
//                 <Text fontSize="lg">
//                   No canvases found. Create your first canvas above.
//                 </Text>
//               </Box>
//             ) : (
//               canvases.map((canvas) => (
//                 <CanvasCard
//                   key={canvas.id}
//                   canvas={canvas}
//                   onOpen={handleOpenCanvas}
//                   onDelete={confirmDelete}
//                   isSubmitting={isSubmitting}
//                 />
//               ))
//             )}
//           </Grid>
//         )}
//       </VStack>

//       <Dialog.Root
//         role="alertdialog"
//         open={open || !!canvasToDelete}
//         onOpenChange={(isOpen) => {
//           if (!isOpen) {
//             handleCancelDelete();
//             onClose();
//           } else {
//             onOpen();
//           }
//         }}
//       >
//         <Portal>
//           <Dialog.Backdrop />
//           <Dialog.Positioner>
//             <Dialog.Content>
//               <Dialog.Header>
//                 <Dialog.Title>Delete Canvas</Dialog.Title>
//               </Dialog.Header>
//               <Dialog.Body>
//                 Are you sure you want to delete this canvas? This action cannot
//                 be undone.
//               </Dialog.Body>
//               <Dialog.Footer>
//                 <Button
//                   ref={cancelRef}
//                   onClick={() => {
//                     handleCancelDelete();
//                     onClose();
//                   }}
//                   variant="outline"
//                   disabled={isSubmitting}
//                 >
//                   Cancel
//                 </Button>
//                 <Button
//                   colorScheme="red"
//                   onClick={() =>
//                     canvasToDelete && handleDeleteCanvas(canvasToDelete)
//                   }
//                   ml={3}
//                   loading={isSubmitting}
//                   loadingText="Deleting"
//                 >
//                   Delete
//                 </Button>
//               </Dialog.Footer>
//             </Dialog.Content>
//           </Dialog.Positioner>
//         </Portal>
//       </Dialog.Root>
//     </Container>
//   );
// };

// export default CanvasSelection;
