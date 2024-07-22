import React, { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "./supabaseClient";
import "./NotesList.css";
import { v5 as uuidv5 } from "uuid";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Note from "./Note";
import EditNoteModal from "./EditNoteModal";
import { FaBars, FaPlus, FaUserPlus, FaChevronLeft } from "react-icons/fa";
import { FaSearch } from 'react-icons/fa';
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
  const [users, setUsers] = useState(["user1"]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const itemsPerPage = 6;

  const MY_NAMESPACE = "1b671a64-40d5-491e-99b0-da01ff1f3341";

  const convertToUUID = (selectedUser) => {
    return uuidv5(selectedUser, MY_NAMESPACE);
  };

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

  useEffect(() => {
    if (!userNotesCache[selectedUser]) {
      fetchNotes(selectedUser);
    } else {
      setNotes(userNotesCache[selectedUser]);
    }
  }, [selectedUser, userNotesCache, fetchNotes]);

  const saveHandler = async () => {
    setIsModalOpen(false);
    setLoading(true);
  
    try {
      if (edit) {
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
          const newNote = data[0];
          setNotes((prevNotes) => [newNote,...prevNotes]);
          toast.success("Note added successfully");
        } else if (data) {
          const newNote = data;
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
      fetchNotes(selectedUser);
      toast.error(`Error deleting note: ${error.message}`);
    }
  };

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

  const editHandler = (id, title, tagline, body) => {
    setEdit(id);
    setInputTitle(title);
    setInputTagline(tagline);
    setInputBody(body);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const createNoteHandler = () => {
    setEdit(null);
    setInputTitle("");
    setInputTagline("");
    setInputBody("");
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const selectPageHandler = () => {
    setPage(page + 1);
  };

  const previousPageHandler = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

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

  const addUserHandler = () => {
    const newUser = `user${users.length + 1}`;
    setUsers([...users, newUser]);
    setSelectedUser(newUser);
    setUserNotesCache((prevCache) => ({
      ...prevCache,
      [newUser]: [],
    }));
    toast.success(`User ${newUser} added successfully`);
  };

  return (
    <div className="app-container">
    <nav className="navbar">
      <div className="navbar-left">
        <FaBars className="menu-icon" onClick={() => setSidebarOpen(!sidebarOpen)} />
        <h1 className="app-title">Notes App</h1>
      </div>
      <div className="navbar-right">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-bar"
        />
         <FaSearch className="search-icon" />
      </div>
    </nav>

    <div className="content-container">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          {sidebarOpen ? (
            <FaChevronLeft className="collapse-icon" onClick={() => setSidebarOpen(false)} />
          ) : (
            <FaBars className="expand-icon" onClick={() => setSidebarOpen(true)} />
          )}
        </div>
        <button className="sidebar-button" onClick={createNoteHandler}>
          <FaPlus /> {sidebarOpen && "Add Note"}
        </button>
        <button className="sidebar-button" onClick={addUserHandler}>
          <FaUserPlus /> {sidebarOpen && "Add User"}
        </button>
        {sidebarOpen && (
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
        )}
      </aside>

      <main className="main-content">
        {loading && <p className="loading-message">Loading...</p>}

        <div className="notes-grid">
          {displayedNotes.map((note, index) => (
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
              color={`note-color-${index % 6}`}
            />
          ))}
        </div>

        {filteredNotes.length > 0 && (
    <div className="pagination">
      <button onClick={previousPageHandler} disabled={page <= 1}>
        ◀️
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button onClick={selectPageHandler} disabled={page >= totalPages}>
        ▶️
      </button>
    </div>
  )}
      </main>
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


