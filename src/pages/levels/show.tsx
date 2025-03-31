import React, { useState, useEffect } from "react";
import {
  useModalForm,
  EditButton,
  DeleteButton,
  ListButton,
} from "@refinedev/antd";
import { useOne, useInvalidate, useApiUrl } from "@refinedev/core";
import {
  Typography,
  Table,
  Space,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  Card,
  Descriptions,
  Divider,
  Breadcrumb,
  message,
} from "antd";
import { UploadOutlined, DragOutlined, ArrowLeftOutlined, DownloadOutlined } from "@ant-design/icons";
import { ILevel, IStep, IScore } from "../../interfaces";
import { useParams, useNavigate } from "react-router-dom";
import { DndContext } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAxiosInstance } from "../../hooks/useAxiosInstance";

const { Title, Paragraph } = Typography;

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

export const LevelShow = () => {
  const { id } = useParams<{ id: string }>();
  const invalidate = useInvalidate();
  const apiUrl = useApiUrl();
  const axiosInstance = useAxiosInstance();
  const navigate = useNavigate();
  
  const { data, isLoading } = useOne<ILevel>({
    resource: "levels",
    id: id || "",
  });

  const [localSteps, setLocalSteps] = useState<IStep[]>([]);

  useEffect(() => {
    if (data?.data?.steps) {
      setLocalSteps(data.data.steps);
    }
  }, [data?.data?.steps]);

  const {
    modalProps: createModalProps,
    formProps: createFormProps,
    show: createModalShow,
  } = useModalForm({
    resource: `levels/${id}/steps`,
    action: "create",
    redirect: false,
    onMutationSuccess: () => {
      invalidate({
        resource: "levels",
        invalidates: ["detail"],
        id,
      });
    },
  });

  const {
    modalProps: editModalProps,
    formProps: editFormProps,
    show: editModalShow,
  } = useModalForm({
    resource: `levels/${id}/steps`,
    action: "edit",
    redirect: false,
    id: undefined, 
    onMutationSuccess: () => {
      invalidate({
        resource: "levels",
        invalidates: ["detail"],
        id,
      });
    },
  });

  const handleScoreUpload = async (file: File, stepId: string) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result?.toString().split(",")[1];
      if (base64Data) {
        try {
          // Show loading message
          const loadingMessage = message.loading('Uploading score...', 0);
          
          // First, upload the score
          const response = await axiosInstance.post(`${apiUrl}/scores`, {
            data: base64Data,
          });
          
          if (response.status === 201) {
            const score = response.data;
            
            // Update step with new scoreId - use the correct property name from the API response
            const scoreId = score._id || score.id; // Handle different possible property names
            
            // Update the step with the scoreId
            await axiosInstance.put(`${apiUrl}/levels/${id}/steps/${stepId}/update-score`, {
              scoreId: scoreId,
            });
            
            // Refresh the level data after updating the score
            invalidate({
              resource: "levels",
              invalidates: ["detail"],
              id,
            });
            
            message.success('Score uploaded and associated with step successfully');
          } else {
            message.error('Failed to upload score');
          }
          
          // Close loading message
          loadingMessage();
        } catch (error) {
          console.error("Error uploading score:", error);
          message.error('Error uploading score');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleScoreDownload = async (scoreId: string, stepName: string) => {
    try {
      // Show loading message
      const loadingMessage = message.loading('Downloading score...', 0);
      
      // Fetch the score data with responseType set to 'blob' to handle binary data
      const response = await axiosInstance.get(`${apiUrl}/scores/${scoreId}`, {
        responseType: 'blob'
      });
      
      if (response.status === 200 && response.data) {
        // The response.data is already a blob, so we can use it directly
        const blob = response.data;
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${stepName.replace(/\s+/g, '_')}.musicxml`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        message.success('Score downloaded successfully');
      } else {
        message.error('Failed to download score');
      }
      
      // Close loading message
      loadingMessage();
    } catch (error) {
      console.error('Error downloading score:', error);
      message.error('Error downloading score');
    }
  };

  const handleDragEnd = async ({ active, over }: any) => {
    if (active.id !== over?.id) {
      const oldIndex = localSteps.findIndex((item) => item._id === active.id);
      const newIndex = localSteps.findIndex((item) => item._id === over.id);

      // Only proceed if both indices are valid
      if (oldIndex !== undefined && newIndex !== undefined && oldIndex >= 0 && newIndex >= 0) {
        // Create a new array with the updated order
        const newData = arrayMove(localSteps, oldIndex, newIndex);

        // Update local state immediately
        setLocalSteps(newData);

        try {
          // Update order in the backend
          await axiosInstance.post(`${apiUrl}/levels/${id}/steps/order`, {
            stepsOrder: newData.map((item) => item._id),
          });
        } catch (error) {
          // If there's an error, revert to the original state
          console.error('Error updating step order:', error);
          setLocalSteps(data?.data?.steps || []);
        }
      }
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ width: '100%' }}>
      <Card style={{ width: '100%' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space style={{ marginBottom: 16 }}>
            <Button 
              type="default" 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/levels')}
            >
              Back to Levels
            </Button>
          </Space>
          
          <Title level={3}>Level Details</Title>
          
          <Descriptions bordered>
            <Descriptions.Item label="Name" span={3}>
              {data?.data.name}
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={3}>
              {data?.data.description}
            </Descriptions.Item>
          </Descriptions>
        </Space>
      </Card>

      <Divider />

      <Card
        style={{ width: '100%' }}
        title={<Title level={4}>Steps for {data?.data.name}</Title>}
        extra={
          <Button type="primary" onClick={() => createModalShow()}>
            Add Step
          </Button>
        }
      >
        <DndContext onDragEnd={handleDragEnd}>
          <SortableContext
            items={localSteps.map((item) => item._id) || []}
            strategy={verticalListSortingStrategy}
          >
            <Table
              rowKey="_id"
              dataSource={localSteps}
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
                  title: "Type",
                  dataIndex: "type",
                  key: "type",
                },
                {
                  title: "Description",
                  dataIndex: "description",
                  key: "description",
                },
                {
                  title: "Actions",
                  key: "actions",
                  render: (_, record: IStep) => (
                    <Space>
                      <EditButton
                        hideText
                        size="small"
                        recordItemId={record._id}
                        onClick={() => {
                          // Set the ID explicitly when showing the edit modal
                          editModalShow(record._id);
                        }}
                      />
                      <DeleteButton
                        hideText
                        size="small"
                        resource={`levels/${id}/steps`}
                        recordItemId={record._id}
                        onSuccess={() => {
                          invalidate({
                            resource: "levels",
                            invalidates: ["detail"],
                            id,
                          });
                        }}
                      />
                      {(
                        <>
                          <Upload
                            beforeUpload={(file) => {
                              handleScoreUpload(file, record._id);
                              return false;
                            }}
                            showUploadList={false}
                          >
                            <Button
                              icon={<UploadOutlined />}
                              size="small"
                              title="Upload Score"
                            />
                          </Upload>
                          {record.scoreId && (
                            <Button
                              icon={<DownloadOutlined />}
                              size="small"
                              title="Download Score"
                              onClick={() => handleScoreDownload(record.scoreId!, record.name)}
                            />
                          )}
                        </>
                      )}
                    </Space>
                  ),
                },
              ]}
            />
          </SortableContext>
        </DndContext>
      </Card>

      <Modal {...createModalProps} title="Create Step">
        <Form {...createFormProps} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Please enter a name" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Type"
            name="type"
            rules={[{ required: true, message: "Please select a type" }]}
          >
            <Select>
              <Select.Option value="Song">Song</Select.Option>
              <Select.Option value="Exercise">Exercise</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal {...editModalProps} title="Edit Step">
        <Form {...editFormProps} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Please enter a name" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Type"
            name="type"
            rules={[{ required: true, message: "Please select a type" }]}
          >
            <Select>
              <Select.Option value="Song">Song</Select.Option>
              <Select.Option value="Exercise">Exercise</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
