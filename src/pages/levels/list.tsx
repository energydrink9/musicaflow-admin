import React, { useState, useEffect } from "react";
import {
  List,
  useTable,
  useModalForm,
  EditButton,
  DeleteButton,
  ShowButton,
} from "@refinedev/antd";
import { useApiUrl, useCustom } from "@refinedev/core";
import {
  Table,
  Space,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Card,
  Typography,
} from "antd";
import { DragOutlined } from "@ant-design/icons";
import { DndContext } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ILevel } from "../../interfaces";
import { useAxiosInstance } from "../../hooks/useAxiosInstance";

const { Title } = Typography;

const DraggableRow = ({ children, ...props }: any) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: props["data-row-key"],
    });

  const style: React.CSSProperties = {
    ...(props.style || {}),
    transform: CSS.Transform.toString(
      transform && {
        ...transform,
        scaleY: 1,
      }
    ),
    transition,
    ...(isDragging
      ? {
          position: "relative",
          zIndex: 9999,
        }
      : {}),
  };

  // Create a modified version of the first cell to include drag listeners
  const childrenWithListeners = React.Children.map(children, (child, index) => {
    if (index === 0) {
      return React.cloneElement(child, {
        ...child.props,
        children: (
          <div {...listeners} style={{ cursor: "grab" }}>
            <DragOutlined />
          </div>
        ),
      });
    }
    return child;
  });

  return (
    <tr
      {...props}
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      {childrenWithListeners}
    </tr>
  );
};

export const LevelsList: React.FC = () => {
  const { tableProps, tableQueryResult } = useTable<ILevel>();

  const apiUrl = useApiUrl();

  const axiosInstance = useAxiosInstance();

  const createLevel = async (data: any) => {
    try {
      const response = await axiosInstance.post(`${apiUrl}/levels`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const updateLevelsOrder = async (data: any) => {
    try {
      const response = await axiosInstance.post(`${apiUrl}/levels/order`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const deleteLevel = async (id: string) => {
    try {
      const response = await axiosInstance.delete(`${apiUrl}/levels/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const {
    modalProps: createModalProps,
    formProps: createFormProps,
    show: showCreateModal,
  } = useModalForm<ILevel>({
    action: "create",
  });

  const {
    modalProps: editModalProps,
    formProps: editFormProps,
    show: showEditModal,
  } = useModalForm<ILevel>({
    action: "edit",
  });

  const [localData, setLocalData] = useState(tableQueryResult.data?.data || []);

  useEffect(() => {
    setLocalData(tableQueryResult.data?.data || []);
  }, [tableQueryResult.data]);

  const handleDragEnd = async ({ active, over }: any) => {
    if (active.id !== over?.id) {
      const oldIndex = localData.findIndex((item) => item._id === active.id);
      const newIndex = localData.findIndex((item) => item._id === over.id);

      // Only proceed if both indices are valid
      if (oldIndex !== undefined && newIndex !== undefined && oldIndex >= 0 && newIndex >= 0) {
        // Create a new array with the updated order
        const newData = arrayMove(localData, oldIndex, newIndex);

        setLocalData(newData);

        try {
          // Update order in the backend
          await updateLevelsOrder({
            levelOrder: newData.map((item) => item._id),
          });
        } catch (error) {
          // If there's an error, revert to the original state
          console.error('Error updating level order:', error);
          setLocalData(tableQueryResult.data?.data || []);
        }
      }
    }
  };

  return (
    <>
      <Card
        style={{ width: '100%' }}
        title={<Title level={4}>Learning Levels</Title>}
        extra={[
          <Button key="create" type="primary" onClick={() => showCreateModal()}>
            Create Level
          </Button>,
        ]}
      >
        <DndContext onDragEnd={handleDragEnd}>
          <SortableContext
            items={localData.map((item) => item._id) || []}
            strategy={verticalListSortingStrategy}
          >
            <Table
              {...tableProps}
              rowKey="_id"
              dataSource={localData}
              components={{
                body: {
                  row: DraggableRow,
                },
              }}
              columns={[
                {
                  title: "",
                  dataIndex: "sort",
                  width: 50,
                  className: "drag-visible",
                  render: () => null,
                },
                {
                  title: "Name",
                  dataIndex: "name",
                  key: "name",
                },
                {
                  title: "Description",
                  dataIndex: "description",
                  key: "description",
                },
                {
                  title: "Actions",
                  dataIndex: "actions",
                  render: (_, record: ILevel) => (
                    <Space>
                      <ShowButton
                        hideText
                        size="small"
                        recordItemId={record._id}
                      />
                      <EditButton
                        hideText
                        size="small"
                        recordItemId={record._id}
                        onClick={() => showEditModal(record._id)}
                      />
                      <DeleteButton
                        hideText
                        size="small"
                        recordItemId={record._id}
                        onClick={() =>
                          deleteLevel(record._id)
                        }
                      />
                    </Space>
                  ),
                },
              ]}
            />
          </SortableContext>
        </DndContext>
      </Card>

      <Modal {...createModalProps} title="Create Level">
        <Form {...createFormProps} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal {...editModalProps} title="Edit Level">
        <Form {...editFormProps} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
