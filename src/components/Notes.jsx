import React, { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "./supabaseClient";
import "./NotesList.css";
import { v5 as uuidv5 } from "uuid";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Note from "./Note";
import EditNoteModal from "./EditNoteModal";

const NotesList = () => {
  const [page, setPage] = useState(1);
  const [inputTitle, setInputTitle] = useState("");
  const [inputTagline, setInputTagline] = useState("");
  const [inputBody, setInputBody] = useState("");
  const [notes, setNotes] = useState([]);
  const [edit, setEdit] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState("user1");
  const [userNotesCache, setUserNotesCache] = useState({});
  const [users, setUsers] = useState(["user1"]); // Initial user list with user1
  const itemsPerPage = 6;

  // UUID namespace for converting selectedUser to UUID
  const MY_NAMESPACE = "1b671a64-40d5-491e-99b0-da01ff1f3341";

  // Function to convert selectedUser to UUID
  const convertToUUID = (selectedUser) => {
    return uuidv5(selectedUser, MY_NAMESPACE);
  };

  // Function to fetch notes for a selected user
  const fetchNotes = useCallback(async (user) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("userid", convertToUUID(user))
        .order("pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      setUserNotesCache((prevCache) => ({
        ...prevCache,
        [user]: data,
      }));
      setNotes(data);
    } catch (error) {
      console.error("Error fetching notes: ", error);
      toast.error(`Error fetching notes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect to fetch notes when selectedUser changes
  useEffect(() => {
    if (!userNotesCache[selectedUser]) {
      fetchNotes(selectedUser);
    } else {
      setNotes(userNotesCache[selectedUser]);
    }
  }, [selectedUser, userNotesCache, fetchNotes]);

  // Save note handler
  const saveHandler = async () => {
    setIsModalOpen(false);
    setLoading(true);
  
    try {
      if (edit) {
        // Update existing note
        const { error } = await supabase
          .from("notes")
          .update({
            title: inputTitle,
            tagline: inputTagline,
            body: inputBody,
          })
          .eq("id", edit)
          .eq("userid", convertToUUID(selectedUser));
  
        if (error) throw error;
  
        setNotes((prevNotes) =>
          prevNotes.map((note) =>
            note.id === edit
              ? {
                  ...note,
                  title: inputTitle,
                  tagline: inputTagline,
                  body: inputBody,
                }
              : note
          )
        );
        toast.success("Note updated successfully");
      } else {
        // Insert new note using RPC
        const { data, error } = await supabase
          .rpc("insert_note", {
            note_title: inputTitle,
            note_tagline: inputTagline,
            note_body: inputBody,
            note_pinned: false,
            user_id: convertToUUID(selectedUser),
          });
  
        if (error) throw error;
  
        if (data && data.length > 0) {
          const newNote = data[0]; // Take the first (and only) item from the array
          setNotes((prevNotes) => [newNote,...prevNotes]);
          toast.success("Note added successfully");
        } else if (data) {
          const newNote = data; // Handle single inserted record
          setNotes((prevNotes) => [newNote,...prevNotes]);
          toast.success("Note added successfully");
        } else {
          console.error("Error inserting note: data is null or empty", data);
          toast.error("Error adding note. Please try again.");
        }
      }
  
      setInputTagline("");
      setInputTitle("");
      setInputBody("");
      setEdit(null);
    } catch (error) {
      console.error("Error saving note: ", error);
      toast.error(`Error saving note: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete note handler
  const deleteHandler = async (id) => {
    const updatedNotes = notes.filter((n) => n.id !== id);
    const subNotes = updatedNotes.slice(
      page * itemsPerPage - itemsPerPage,
      page * itemsPerPage
    );
    setNotes(updatedNotes);

    if (subNotes.length === 0 && page > 1) {
      setPage(page - 1);
    }

    try {
      const { error } = await supabase.from("notes").delete().eq("id", id);

      if (error) throw error;

      toast.success("Note deleted successfully");
    } catch (error) {
      console.error("Error deleting note: ", error);
      fetchNotes(selectedUser); // Re-fetch notes after deletion
      toast.error(`Error deleting note: ${error.message}`);
    }
  };

  // Pin/unpin note handler
  const pinHandler = async (id) => {
    setLoading(true);
    try {
      const noteToPin = notes.find((note) => note.id === id);
      if (!noteToPin) {
        console.error("Note not found");
        setLoading(false);
        return;
      }

      const newPinnedState = !noteToPin.pinned;
      const { error } = await supabase
        .from("notes")
        .update({ pinned: newPinnedState })
        .eq("id", id);

      if (error) throw error;

      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === id ? { ...note, pinned: newPinnedState } : note
        )
      );

      toast[newPinnedState ? "success" : "warning"](
        `Note ${newPinnedState ? "pinned" : "unpinned"}`
      );
    } catch (error) {
      console.error("Error pinning/unpinning note: ", error);
      toast.error(`Error pinning/unpinning note: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Edit note handler
  const editHandler = (id, title, tagline, body) => {
    setEdit(id);
    setInputTitle(title);
    setInputTagline(tagline);
    setInputBody(body);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // Create note handler
  const createNoteHandler = () => {
    setEdit(null);
    setInputTitle("");
    setInputTagline("");
    setInputBody("");
    setIsEditing(false);
    setIsModalOpen(true);
  };

  // Pagination handlers
  const selectPageHandler = () => {
    setPage(page + 1);
  };

  const previousPageHandler = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  // Memoized filtered notes and displayed notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter(
        (note) =>
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.body.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => b.pinned - a.pinned);
  }, [notes, searchQuery]);

  useEffect(() => {
    if (searchQuery !== "" && filteredNotes.length === 0) {
      toast.error("No notes found");
    }
  }, [searchQuery, filteredNotes]);

  const totalPages = Math.ceil(filteredNotes.length / itemsPerPage);

  const displayedNotes = useMemo(
    () =>
      filteredNotes.slice(
        page * itemsPerPage - itemsPerPage,
        page * itemsPerPage
      ),
    [filteredNotes, page, itemsPerPage]
  );

  // Add user handler
  const addUserHandler = () => {
    const newUser = `user${users.length + 1}`;
    setUsers([...users, newUser]);
    setSelectedUser(newUser);
    setUserNotesCache((prevCache) => ({
      ...prevCache,
      [newUser]: [], // Initialize cache for the new user
    }));
    toast.success(`User ${newUser} added successfully`);
  };

  return (
    <div className="main">
      <div className="nav">
        <select
          value={selectedUser}
          onChange={(e) => {
            setSelectedUser(e.target.value);
            fetchNotes(e.target.value);
          }}
          className="user-dropdown"
        >
          {users.map((user) => (
            <option key={user} value={user}>
              {`User ${user.charAt(user.length - 1)}`}
            </option>
          ))}
        </select>
        <button className="create" onClick={createNoteHandler}>
          Add Note
        </button>
        <button className="add-user" onClick={addUserHandler}>
          Add User
        </button>
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-bar"
        />
      </div>

      {loading && <p>Loading...</p>}

      <div className="notes">
        {displayedNotes.map((note) => (
          <Note
            key={note.id}
            id={note.id}
            tagline={note.tagline}
            title={note.title}
            body={note.body}
            editHandler={editHandler}
            deleteHandler={deleteHandler}
            pinHandler={pinHandler}
            pinned={note.pinned}
          />
        ))}
      </div>
      <div className="paginate">
        <button onClick={previousPageHandler} disabled={page <= 1}>
          ◀️
        </button>
        {filteredNotes.length > 0 && (
          <span>
            Page {page} of {totalPages}
          </span>
        )}
        <button onClick={selectPageHandler} disabled={page >= totalPages}>
          ▶️
        </button>
      </div>

      <EditNoteModal
        isOpen={isModalOpen}
        inputTitle={inputTitle}
        setInputTitle={setInputTitle}
        inputTagline={inputTagline}
        setInputTagline={setInputTagline}
        inputBody={inputBody}
        setInputBody={setInputBody}
        saveHandler={saveHandler}
        closeModal={() => setIsModalOpen(false)}
        isEditing={isEditing}
      />
      <ToastContainer />
    </div>
  );
};

export default NotesList;


