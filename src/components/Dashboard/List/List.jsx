import React, { useContext, useState } from 'react';
import ViewPositionModal from '../../Modals/ViewPosition/ViewPositionModal';
import AddPositionModal from '../../Modals/AddPosition/AddPositionModal';
import Spinner from '../../Spinner/Spinner';
import Sort from '../Sort/Sort.jsx';
import { addIcon, filterIcon } from '../../../assets/icons';
import useKanban from '../../../hooks/useKanban';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { app } from '../../../config/firebase';
import * as S from './style.js';

// Context Imports
import { SelectedPositionContext } from '../../../contexts/SelectedPositionContext';
import { PositionsContext } from '../../../contexts/PositionsContext';
import { MessagesContext } from '../../../contexts/MessagesContext';
import { useAuth } from '../../../contexts/AuthContext';

// props = { searchTerm: ""}
// List = (props)
const List = (props = {}) => {
  const searchTerm = props.searchTerm || '';

  const { positions } = useContext(PositionsContext);
  const { setSelectedPosition } = useContext(SelectedPositionContext);
  const { information } = useContext(MessagesContext);
  const { currentUser } = useAuth();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [isSortOpen, setToggle] = useState(Array(5).fill(false));

  const addSelectedPosition = (position) => {
    setSelectedPosition({ data: position.doc, selected: true });
  };
  const { initialData, setInitialData } = useKanban(currentUser.uid);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    const startColumn = initialData.columns.find((col) => col.id === source.droppableId);
    const startColumnIndex = initialData.columns.findIndex((col) => col.id === source.droppableId);
    const endColumn = initialData.columns.find((col) => col.id === destination.droppableId);
    const endColumnIndex = initialData.columns.findIndex((col) => col.id === destination.droppableId);

    if (startColumn === endColumn) {
      const newPositionIds = Array.from(endColumn.positionIds);

      newPositionIds.splice(source.index, 1);
      newPositionIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...endColumn,
        positionIds: newPositionIds,
      };

      const newState = {
        ...initialData,
        columns: [...initialData.columns],
      };

      newState.columns[endColumnIndex] = newColumn;

      app
        .firestore()
        .collection('users')
        .doc(`${currentUser.uid}`)
        .collection('columns')
        .doc(`${startColumn.id}`)
        .update({ positionIds: newPositionIds });

      setInitialData(newState);

      return;
    }

    const startPositionIDs = Array.from(startColumn.positionIds);
    startPositionIDs.splice(source.index, 1);
    const newStart = {
      ...startColumn,
      taskIds: startPositionIDs,
    };

    const finishPositionIDs = Array.from(endColumn.positionIds);
    finishPositionIDs.splice(destination.index, 0, draggableId);
    const newFinish = {
      ...endColumn,
      taskIds: finishPositionIDs,
    };

    const newState = {
      ...initialData,
      columns: [...initialData.columns],
    };

    newState.columns[startColumnIndex] = newStart;
    newState.columns[endColumnIndex] = newFinish;

    app
      .firestore()
      .collection('users')
      .doc(`${currentUser.uid}`)
      .collection('columns')
      .doc(`${startColumn.id}`)
      .update({ positionIds: startPositionIDs });

    app
      .firestore()
      .collection('users')
      .doc(`${currentUser.uid}`)
      .collection('columns')
      .doc(`${endColumn.id}`)
      .update({ positionIds: finishPositionIDs });

    app.firestore().collection('positions').doc(`${draggableId}`).update({ status: endColumn.title });
    setInitialData(newState);
  };
  const toggleSort = (index) => {
    const newState = [...isSortOpen];
    newState[index] = !newState[index];

    setToggle([...newState]);
  };

  return (
    <S.ListWrapper>
      {positions.loading ? (
        <Spinner />
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          {initialData &&
            initialData.columns.map((column, index) => {
              return (
                <S.List key={column.id}>
                  <S.ListHeader positionTitle={column.title}>
                    <S.FilterButton data-tooltip="Sort By">
                      {isSortOpen[index] && (
                        <Sort
                          title={selectedTitle.title}
                          onClick={() => {
                            toggleSort(index);
                          }}
                        />
                      )}

                      <img
                        onClick={() => {
                          toggleSort(index);
                          setSelectedTitle(column);
                        }}
                        src={filterIcon}
                        alt="Filter Icon"
                      />
                    </S.FilterButton>
                    <S.HeaderTypography>{column.title}</S.HeaderTypography>

                    <S.AddButton
                      data-tooltip="Add Position"
                      onClick={() => {
                        setSelectedTitle(column);
                        setIsCreateOpen(true);
                      }}>
                      <img src={addIcon} alt="Add Button" />
                    </S.AddButton>
                  </S.ListHeader>
                  {information.errorLine && column.title === information.errorLine[0] ? (
                    information.errorLine[1] === 'bad' ? (
                      <S.ListMessages message="bad">
                        <span>{information.message}</span>
                      </S.ListMessages>
                    ) : (
                      <S.ListMessages message="good">
                        <span>{information.message}</span>
                      </S.ListMessages>
                    )
                  ) : (
                    ''
                  )}

                  <S.ListBody>
                    <Droppable droppableId={column.id} type="position" key={props}>
                      {(provided) => {
                        return (
                          <S.InnerList ref={provided.innerRef} {...provided.droppableProps}>
                            {column.positionIds
                              .filter((value) => {
                                let position = initialData.positions[value];
                                if (searchTerm === '') {
                                  return value;
                                } else if (
                                  position &&
                                  position.doc.name.toLowerCase().includes(searchTerm.toLowerCase())
                                ) {
                                  return value;
                                } else if (
                                  position &&
                                  position.doc.position.toLowerCase().includes(searchTerm.toLowerCase())
                                ) {
                                  return value;
                                }
                              })
                              .map((positionId, index) => {
                                let position = initialData.positions[positionId];

                                if (position) {
                                  return (
                                    currentUser.uid === position.doc.uid &&
                                    column.title === position.doc.status && (
                                      <Draggable draggableId={position.doc.id} index={index} key={position.doc.id}>
                                        {(provided, snapshot) => (
                                          <S.PositionWrapper
                                            data-tooltip={position.doc.position}
                                            positionTitle={position.doc.status}
                                            key={position.doc.id}
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            onClick={() => {
                                              addSelectedPosition(position);
                                              setIsViewOpen(true);
                                            }}>
                                            <S.PositionHeader>{position.doc.position}</S.PositionHeader>
                                            <S.PositionBody>{position.doc.name}</S.PositionBody>
                                            <S.PositionFooter>{position.doc.date}</S.PositionFooter>
                                          </S.PositionWrapper>
                                        )}
                                      </Draggable>
                                    )
                                  );
                                }
                              })}

                            {provided.placeholder}
                          </S.InnerList>
                        );
                      }}
                    </Droppable>
                  </S.ListBody>
                </S.List>
              );
            })}
        </DragDropContext>
      )}
      <AddPositionModal selectedTitle={selectedTitle} open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <ViewPositionModal
        columns={initialData && initialData.columns}
        open={isViewOpen}
        onClose={() => setIsViewOpen(false)}
      />
    </S.ListWrapper>
  );
};

export default List;
