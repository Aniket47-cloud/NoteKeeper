import React from "react";
import "./EditNoteModal.css";

const EditNoteModal = ({
  isOpen,
  inputTitle,
  setInputTitle,
  inputTagline,
  setInputTagline,
  inputBody,
  setInputBody,
  saveHandler,
  closeModal,
  isEditing,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{isEditing ? "Edit Note" : "Create Note"}</h2>
        <input
        id="title"
          type="text"
          value={inputTitle}
          onChange={(e) => setInputTitle(e.target.value)}
          placeholder="Title"
        />
        <input
        id="tag"
          type="text"
          value={inputTagline}
          onChange={(e) => setInputTagline(e.target.value)}
          placeholder="Tagline"
        />
        <textarea
          value={inputBody}
          onChange={(e) => setInputBody(e.target.value)}
          placeholder="Body"
          
        ></textarea>
        <div className="button-box">
        <button onClick={saveHandler}>{isEditing ? "Save" : "Create"}</button>
        <button onClick={closeModal}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default EditNoteModal;
