import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  Input,
  Text,
  VStack,
  IconButton,
  useDisclosure,
  Dialog,
  Portal,
  Spinner,
} from "@chakra-ui/react";
import { LuX as CloseIcon } from "react-icons/lu";
import {
  getCanvasesForUser,
  createCanvas,
  deleteCanvas,
  getCanvas,
} from "@/api/services/CanvasService";
import { Canvas } from "@/types";

const CanvasSelection = () => {
  const navigate = useNavigate();
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [newCanvasName, setNewCanvasName] = useState("");
  const [canvasToDelete, setCanvasToDelete] = useState<string | null>(null);
  const { open, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load canvases from API on component mount
  useEffect(() => {
    const loadCanvases = async () => {
      setIsLoading(true);
      try {
        const loadedCanvases = await getCanvasesForUser();
        setCanvases(loadedCanvases as Canvas[]);
        setError(null);
      } catch (err) {
        console.error("Error loading canvases:", err);
        setError("Failed to load canvases. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadCanvases();
  }, []);

  // No need for the useEffect that saves to localStorage - we're using the API now

  const handleCreateCanvas = async () => {
    if (!newCanvasName.trim()) return;

    setIsSubmitting(true);
    try {
      const newCanvas = await createCanvas(newCanvasName);
      setCanvases([...canvases, newCanvas]);
      setNewCanvasName("");
      setError(null);
    } catch (err) {
      console.error("Error creating canvas:", err);
      setError("Failed to create new canvas. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCanvas = async (id: string) => {
    setIsSubmitting(true);
    try {
      await deleteCanvas(id);
      // Remove the canvas from the state
      const updatedCanvases = canvases.filter((canvas) => canvas.id !== id);
      setCanvases(updatedCanvases);
      setError(null);
    } catch (err) {
      console.error("Error deleting canvas:", err);
      setError("Failed to delete canvas. Please try again.");
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  const confirmDelete = (
    id: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setCanvasToDelete(id);
    onOpen();
  };

  const handleOpenCanvas = async (id: string) => {
    setIsSubmitting(true);
    try {
      // Get canvas data before navigation
      await getCanvas(id);
      // If successful, navigate to the canvas
      navigate(`/canvas/${id}`);
      setError(null);
    } catch (err) {
      console.error("Error retrieving canvas:", err);
      setError("Failed to open canvas. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack gap={8} width="100%">
        <Heading textAlign="center" size="xl">
          My Canvases
        </Heading>

        {error && (
          <Text color="red.500" textAlign="center">
            {error}
          </Text>
        )}

        <Flex justifyContent="center" width="100%" mb={8}>
          <Input
            value={newCanvasName}
            onChange={(e) => setNewCanvasName(e.target.value)}
            placeholder="Enter canvas name"
            size="md"
            maxW="300px"
            mr={4}
            disabled={isSubmitting}
          />
          <Button
            onClick={handleCreateCanvas}
            colorScheme="blue"
            loading={isSubmitting}
            loadingText="Creating"
          >
            Create New Canvas
          </Button>
        </Flex>

        {isLoading ? (
          <Flex justify="center" width="100%" py={10}>
            <Spinner size="xl" />
          </Flex>
        ) : (
          <Grid
            templateColumns="repeat(auto-fill, minmax(300px, 1fr))"
            gap={6}
            width="100%"
          >
            {canvases.length === 0 ? (
              <Box textAlign="center" gridColumn="1/-1">
                <Text fontSize="lg">
                  No canvases found. Create your first canvas above.
                </Text>
              </Box>
            ) : (
              canvases.map((canvas) => (
                <Box
                  key={canvas.id}
                  borderWidth="1px"
                  borderRadius="lg"
                  overflow="hidden"
                  boxShadow="sm"
                  p={5}
                >
                  <Flex
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <Heading size="md">{canvas.name}</Heading>
                    <IconButton
                      aria-label="Delete Canvas"
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={(e) => confirmDelete(canvas.id, e)}
                      disabled={isSubmitting}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Flex>
                  <Text mb={4}>
                    Created: {canvas.createdAt.toLocaleDateString()}
                  </Text>
                  <Button
                    onClick={() => handleOpenCanvas(canvas.id)}
                    colorScheme="blue"
                    width="100%"
                  >
                    Open Canvas
                  </Button>
                </Box>
              ))
            )}
          </Grid>
        )}
      </VStack>

      <Dialog.Root
        role="alertdialog"
        open={open}
        onOpenChange={(isOpen) => (isOpen ? onOpen() : onClose())}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Delete Canvas</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                Are you sure you want to delete this canvas? This action cannot
                be undone.
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  ref={cancelRef}
                  onClick={onClose}
                  variant="outline"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="red"
                  onClick={() =>
                    canvasToDelete && handleDeleteCanvas(canvasToDelete)
                  }
                  ml={3}
                  loading={isSubmitting}
                  loadingText="Deleting"
                >
                  Delete
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Container>
  );
};

export default CanvasSelection;
