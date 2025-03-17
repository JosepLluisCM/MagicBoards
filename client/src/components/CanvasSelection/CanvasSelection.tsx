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
} from "@chakra-ui/react";
import { LuX as CloseIcon } from "react-icons/lu";

interface Canvas {
  id: string;
  name: string;
  createdAt: Date;
}

const CanvasSelection = () => {
  const navigate = useNavigate();
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [newCanvasName, setNewCanvasName] = useState("");
  const [canvasToDelete, setCanvasToDelete] = useState<string | null>(null);
  const { open, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Load canvases from localStorage on component mount
  useEffect(() => {
    const savedCanvases = localStorage.getItem("canvases");
    if (savedCanvases) {
      try {
        // Parse the JSON string and convert date strings back to Date objects
        const parsedCanvases = JSON.parse(savedCanvases).map((canvas: any) => ({
          ...canvas,
          createdAt: new Date(canvas.createdAt),
        }));
        setCanvases(parsedCanvases);
      } catch (error) {
        console.error("Error parsing canvases from localStorage:", error);
        // If there's an error, initialize with a default canvas
        setCanvases([
          {
            id: "1",
            name: "My First Canvas",
            createdAt: new Date(),
          },
        ]);
      }
    } else {
      // If no canvases in localStorage, initialize with a default canvas
      setCanvases([
        {
          id: "1",
          name: "My First Canvas",
          createdAt: new Date(),
        },
      ]);
    }
  }, []);

  // Save canvases to localStorage whenever they change
  useEffect(() => {
    if (canvases.length > 0) {
      localStorage.setItem("canvases", JSON.stringify(canvases));
    }
  }, [canvases]);

  const handleCreateCanvas = () => {
    if (!newCanvasName.trim()) return;

    const newCanvas: Canvas = {
      id: Date.now().toString(),
      name: newCanvasName,
      createdAt: new Date(),
    };

    setCanvases([...canvases, newCanvas]);
    setNewCanvasName("");
  };

  const handleDeleteCanvas = (id: string) => {
    // Remove the canvas from the state
    const updatedCanvases = canvases.filter((canvas) => canvas.id !== id);
    setCanvases(updatedCanvases);

    // Also remove the canvas data from localStorage
    localStorage.removeItem(`canvas_data_${id}`);
    localStorage.removeItem(`canvas_position_${id}`);
    onClose();
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

  return (
    <Container maxW="container.xl" py={8}>
      <VStack gap={8} width="100%">
        <Heading textAlign="center" size="xl">
          My Canvases
        </Heading>

        <Flex justifyContent="center" width="100%" mb={8}>
          <Input
            value={newCanvasName}
            onChange={(e) => setNewCanvasName(e.target.value)}
            placeholder="Enter canvas name"
            size="md"
            maxW="300px"
            mr={4}
          />
          <Button onClick={handleCreateCanvas} colorScheme="blue">
            Create New Canvas
          </Button>
        </Flex>

        <Grid
          templateColumns="repeat(auto-fill, minmax(300px, 1fr))"
          gap={6}
          width="100%"
        >
          {canvases.map((canvas) => (
            <Box
              key={canvas.id}
              borderWidth="1px"
              borderRadius="lg"
              overflow="hidden"
              boxShadow="sm"
              p={5}
            >
              <Flex justifyContent="space-between" alignItems="center" mb={2}>
                <Heading size="md">{canvas.name}</Heading>
                <IconButton
                  aria-label="Delete Canvas"
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  onClick={(e) => confirmDelete(canvas.id, e)}
                >
                  <CloseIcon />
                </IconButton>
              </Flex>
              <Text mb={4}>
                Created: {canvas.createdAt.toLocaleDateString()}
              </Text>
              <Button
                onClick={() => navigate(`/canvas/${canvas.id}`)}
                colorScheme="blue"
                width="100%"
              >
                Open Canvas
              </Button>
            </Box>
          ))}
        </Grid>
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
                <Button ref={cancelRef} onClick={onClose} variant="outline">
                  Cancel
                </Button>
                <Button
                  colorScheme="red"
                  onClick={() =>
                    canvasToDelete && handleDeleteCanvas(canvasToDelete)
                  }
                  ml={3}
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
